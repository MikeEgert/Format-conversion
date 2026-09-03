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

interface NormalizedTextItem {
  x: number
  y: number
  width: number
  text: string
}

/** A gap wider than this fraction of the page's text span is a column gutter. */
const COLUMN_GAP_RATIO = 0.08
/** Each column must contain at least this many items to be treated as one. */
const COLUMN_MIN_ITEMS = 2

/**
 * Split items into left-to-right columns by detecting vertical whitespace
 * gutters. Items are sorted by x and any horizontal band that no item's extent
 * covers, wider than `COLUMN_GAP_RATIO` of the page's text span, is a gutter.
 * The `COLUMN_MIN_ITEMS` guard avoids splitting on stray wide items (e.g. a
 * lone right-aligned page number). Recurses so three-or-more column layouts
 * work. A full-width item (a title/header spanning the gutter) defeats
 * detection and the page is treated as a single column.
 */
function splitColumns(items: NormalizedTextItem[]): NormalizedTextItem[][] {
  if (items.length < COLUMN_MIN_ITEMS * 2) return [items]

  let minX = Infinity
  let maxX = -Infinity
  for (const item of items) {
    minX = Math.min(minX, item.x)
    maxX = Math.max(maxX, item.x + item.width)
  }
  const span = maxX - minX
  if (span <= 0) return [items]

  const sorted = [...items].sort((a, b) => a.x - b.x)
  let bestGap = 0
  let bestIndex = -1
  let runningEnd = sorted[0].x + sorted[0].width
  for (let i = 1; i < sorted.length; i += 1) {
    const start = sorted[i].x
    if (start > runningEnd) {
      const gap = start - runningEnd
      if (gap > bestGap) {
        bestGap = gap
        bestIndex = i
      }
    }
    runningEnd = Math.max(runningEnd, sorted[i].x + sorted[i].width)
  }

  if (bestIndex === -1 || bestGap < COLUMN_GAP_RATIO * span) return [items]

  const left = sorted.slice(0, bestIndex)
  const right = sorted.slice(bestIndex)
  if (left.length < COLUMN_MIN_ITEMS || right.length < COLUMN_MIN_ITEMS) return [items]

  return [...splitColumns(left), ...splitColumns(right)]
}

/** Group items on the same baseline into lines, left-to-right. */
function assembleLines(items: NormalizedTextItem[], yTolerance: number): string[] {
  const rows = new Map<number, { x: number; text: string; width: number }[]>()

  for (const item of items) {
    const y = item.y
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
    rows.get(key)!.push({ x: item.x, text: item.text, width: item.width })
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

/**
 * Reconstruct reading-order lines from a page's raw text items.
 *
 * pdf.js reports text as a flat list with 2D coordinates (`transform[4]` = x,
 * `transform[5]` = y, origin bottom-left). Side-by-side columns are split
 * first (see `splitColumns`), then items sharing a baseline (y within
 * `yTolerance`) are grouped into one line and ordered left-to-right by x.
 * PDF coordinates grow upward, so lines are emitted top-to-bottom.
 */
export function itemsToLines(items: PdfTextContent[], yTolerance = 3): string[] {
  const normalized: NormalizedTextItem[] = []
  for (const item of items) {
    if (!('str' in item) || typeof item.str !== 'string' || item.str.length === 0) continue
    if (!item.transform) continue
    normalized.push({
      x: item.transform[4],
      y: item.transform[5],
      width: item.width ?? 0,
      text: item.str,
    })
  }

  return splitColumns(normalized).flatMap((column) => assembleLines(column, yTolerance))
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

interface PdfExceptionClasses {
  PasswordException: new (...args: never[]) => unknown
  InvalidPDFException: new (...args: never[]) => unknown
}

/**
 * Detect an out-of-memory condition. JS has no dedicated OOM exception, but
 * allocation failures surface as `RangeError` with a recognizable message
 * (e.g. "Array buffer allocation failed", "Invalid string length",
 * "WebAssembly.Memory.grow(): Out of memory"). Restricting to `RangeError`
 * avoids misclassifying unrelated errors that merely mention memory.
 */
export function isOutOfMemoryError(err: unknown): boolean {
  if (!(err instanceof RangeError)) return false
  return /out of memory|allocation failed|invalid (?:typed array|string) length|memory\.grow/i.test(
    err.message,
  )
}

/**
 * Map a pdf.js load failure to a specific, actionable error. Uses `instanceof`
 * against the exception classes pdf.js exports (available on the namespace
 * returned by `import('pdfjs-dist')`), rather than matching their internal
 * `name` strings.
 */
export function pdfErrorToConversionError(
  err: unknown,
  pdfjs: PdfExceptionClasses,
): ConversionError {
  if (err instanceof pdfjs.PasswordException) {
    return new ConversionError(
      'This PDF is password-protected.',
      'Remove the password protection (or export it without a password) and try again.',
    )
  }
  if (err instanceof pdfjs.InvalidPDFException) {
    return new ConversionError(
      'This PDF is corrupted or invalid.',
      'The file could not be parsed. Try re-saving or re-exporting the PDF.',
    )
  }
  if (isOutOfMemoryError(err)) {
    return new ConversionError(
      'This PDF is too large to process in your browser.',
      'The browser ran out of memory. Try a smaller or less complex PDF, or close other tabs to free up memory.',
    )
  }
  return new ConversionError(
    'Could not read this PDF.',
    'It may use an unsupported feature or be too large to process. Try a smaller or re-exported PDF.',
  )
}

async function extractPdfText(data: ArrayBuffer): Promise<string[][]> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  let loadingTask: ReturnType<typeof pdfjs.getDocument> | undefined
  try {
    loadingTask = pdfjs.getDocument({ data })
    const doc = await loadingTask.promise
    const pages: string[][] = []
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      pages.push(itemsToLines(content.items))
      page.cleanup()
    }
    return pages
  } catch (err) {
    throw pdfErrorToConversionError(err, pdfjs)
  } finally {
    if (loadingTask) await loadingTask.destroy()
  }
}

export const pdfToDocx: Converter = {
  id: 'pdf-to-docx',
  name: 'PDF to DOCX',
  category: 'Documents',
  fromLabel: 'PDF',
  toLabel: 'DOCX',
  description: 'Turn PDFs into editable Word documents.',
  detail: {
    about:
      'Extract the text layer of a PDF into an editable Word document. Text is re-flowed as clean paragraphs (one per line), preserving page breaks and simple multi-column layouts. Layout, images, and styling are not reconstructed, and complex tables may come out reordered — for best results use a PDF that was created digitally, not scanned.',
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

    const pages = await extractPdfText(arrayBuffer)

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
