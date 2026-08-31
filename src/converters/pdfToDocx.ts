import { strToU8, zipSync } from 'fflate'
import { isPdfFile, replaceExtension } from './helpers'
import { ConversionError, type Converter } from './types'

/**
 * Structural shapes mirroring the items pdf.js yields from `getTextContent()`
 * (its `items` array is typed `Array<TextItem | TextMarkedContent>`). Mirroring
 * the union lets us pass `content.items` straight through with no cast; the
 * text-bearing `PdfTextContentItem` keeps `str` optional so marked-content
 * entries are still assignable, and they are filtered out at runtime.
 */
export interface PdfTextContentItem {
  str?: string
  transform?: number[]
  width?: number
}

export interface PdfTextMarkedContentItem {
  type: string
  id?: string
}

export type PdfTextContent = PdfTextContentItem | PdfTextMarkedContentItem

/**
 * Reconstruct reading-order lines from a page's raw text items.
 *
 * pdf.js reports text as a flat list with 2D coordinates (`transform[4]` = x,
 * `transform[5]` = y, origin bottom-left). Items sharing a baseline (y within
 * `yTolerance`) are grouped into one line and ordered left-to-right by x.
 * PDF coordinates grow upward, so lines are emitted top-to-bottom.
 */
export function itemsToLines(items: PdfTextContent[], yTolerance = 3): string[] {
  const rows = new Map<number, { x: number; text: string; width: number }[]>()

  for (const item of items) {
    if (!('str' in item) || typeof item.str !== 'string' || item.str.length === 0) continue
    if (!item.transform) continue

    const y = item.transform[5]
    let key = -1
    for (const existing of rows.keys()) {
      if (Math.abs(existing - y) <= yTolerance) {
        key = existing
        break
      }
    }
    if (key === -1) {
      key = y
      rows.set(key, [])
    }
    rows.get(key)!.push({ x: item.transform[4], text: item.str, width: item.width ?? 0 })
  }

  const lines: string[] = []
  for (const y of [...rows.keys()].sort((a, b) => b - a)) {
    const row = rows.get(y)!
    row.sort((a, b) => a.x - b.x)

    let line = ''
    let prevEnd: number | null = null
    let prevAvgChar = 0
    for (const part of row) {
      if (prevEnd !== null) {
        const gap = part.x - prevEnd
        if (gap > Math.max(1, prevAvgChar)) line += ' '
      }
      line += part.text
      prevEnd = part.x + part.width
      prevAvgChar = part.width / Math.max(1, part.text.length)
    }

    const trimmed = line.replace(/\s+/g, ' ').trim()
    if (trimmed.length > 0) lines.push(trimmed)
  }

  return lines
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Drop characters that are illegal in XML 1.0 (control chars except tab/LF/CR). */
function sanitizeXml(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
}

function paragraphXml(text: string): string {
  const safe = sanitizeXml(text)
  if (safe.length === 0) return '<w:p/>'
  const runs = safe
    .split('\n')
    .map((part, i) => `${i > 0 ? '<w:r><w:br/></w:r>' : ''}<w:r><w:t xml:space="preserve">${escapeXml(part)}</w:t></w:r>`)
    .join('')
  return `<w:p>${runs}</w:p>`
}

const PAGE_BREAK_XML = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

function documentXml(pages: string[][]): string {
  const paragraphs: string[] = []
  pages.forEach((lines, index) => {
    if (index > 0) paragraphs.push(PAGE_BREAK_XML)
    for (const line of lines) paragraphs.push(paragraphXml(line))
  })
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs.join('')}<w:sectPr/></w:body></w:document>`
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`

function rootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`
}

function coreXml(title: string): string {
  const safe = escapeXml(sanitizeXml(title))
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${safe}</dc:title><dc:creator>FoldenLoom PDF to DOCX</dc:creator></cp:coreProperties>`
}

const APP_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>FoldenLoom PDF to DOCX</Application></Properties>`

/**
 * Build a minimal but valid .docx (OOXML ZIP) from extracted page text.
 * Each line becomes a paragraph; a page break separates PDF pages.
 * Exported separately from the converter so the structure is unit-testable.
 */
export function linesToDocx(pages: string[][], filename: string): Uint8Array<ArrayBuffer> {
  const title = filename.replace(/\.[^.]+$/, '')
  return new Uint8Array(
    zipSync({
      '[Content_Types].xml': strToU8(CONTENT_TYPES),
      '_rels/.rels': strToU8(rootRelsXml()),
      'word/document.xml': strToU8(documentXml(pages)),
      'docProps/core.xml': strToU8(coreXml(title)),
      'docProps/app.xml': strToU8(APP_XML),
    }),
  )
}

async function extractPdfText(data: ArrayBuffer): Promise<string[][]> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const loadingTask = pdfjs.getDocument({ data })
  const doc = await loadingTask.promise
  try {
    const pages: string[][] = []
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      pages.push(itemsToLines(content.items))
      page.cleanup()
    }
    return pages
  } finally {
    await loadingTask.destroy()
  }
}

export const pdfToDocx: Converter = {
  id: 'pdf-to-docx',
  name: 'PDF to DOCX',
  fromLabel: 'PDF',
  toLabel: 'DOCX',
  description: 'Turn PDFs into editable Word documents.',
  detail: {
    about:
      'Extract the text layer of a PDF into an editable Word document. Text is re-flowed as clean paragraphs (one per line), preserving page breaks. Layout, images, and styling are not reconstructed — for best results use a PDF that was created digitally, not scanned.',
    useCases: [
      'Edit text from a PDF that has no Word source',
      'Copy content from a PDF into a document you are drafting',
      'Re-type or re-purpose a PDF report',
    ],
    accepts: ['PDF'],
  },
  accept: '.pdf,application/pdf',
  outputType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  async convert(file) {
    const arrayBuffer = await file.arrayBuffer()
    if (!isPdfFile(arrayBuffer)) {
      throw new ConversionError(
        "This isn't a valid PDF.",
        'A PDF file starts with "%PDF". Make sure you picked a real .pdf file.',
      )
    }

    let pages: string[][]
    try {
      pages = await extractPdfText(arrayBuffer)
    } catch {
      throw new ConversionError(
        'Could not read this PDF.',
        'It may be corrupted or password-protected, or it may be a scanned image with no text layer to extract.',
      )
    }

    if (pages.every((page) => page.length === 0)) {
      throw new ConversionError(
        'This PDF has no extractable text.',
        'It is likely a scan or image-only PDF. OCR is not supported — this works on digital PDFs with selectable text.',
      )
    }

    return {
      blob: new Blob([linesToDocx(pages, file.name)], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      filename: replaceExtension(file.name, 'docx'),
    }
  },
}
