import { ConversionError } from '../converters/types'
import { isPdfFile } from '../converters/helpers'

export interface PdfPageOperation {
  sourceIndex: number
  rotation: 0 | 90 | 180 | 270
}

async function loadPdf(data: ArrayBuffer) {
  if (!isPdfFile(data)) {
    throw new ConversionError(
      "This isn't a valid PDF.",
      'A PDF file starts with "%PDF". Make sure you picked a real .pdf file.',
    )
  }

  try {
    const { PDFDocument } = await import('pdf-lib')
    return { PDFDocument, document: await PDFDocument.load(data) }
  } catch {
    throw new ConversionError(
      'This PDF could not be opened.',
      'It may be password-protected, corrupted, or use an unsupported PDF feature.',
    )
  }
}

export async function getPdfPageCount(data: ArrayBuffer): Promise<number> {
  const { document } = await loadPdf(data)
  return document.getPageCount()
}

export async function mergePdfs(inputs: ArrayBuffer[]): Promise<Uint8Array> {
  if (inputs.length < 2) {
    throw new ConversionError('Select at least two PDFs to merge.')
  }

  const { PDFDocument } = await import('pdf-lib')
  const output = await PDFDocument.create()
  for (const input of inputs) {
    const { document } = await loadPdf(input)
    const pages = await output.copyPages(document, document.getPageIndices())
    for (const page of pages) output.addPage(page)
  }
  return output.save()
}

export async function extractPdfPages(
  data: ArrayBuffer,
  pageNumbers: number[],
): Promise<Uint8Array> {
  const { PDFDocument, document } = await loadPdf(data)
  const pageIndices = pageNumbers.map((page) => page - 1)
  if (
    pageIndices.length === 0 ||
    pageIndices.some((page) => page < 0 || page >= document.getPageCount())
  ) {
    throw new ConversionError('One or more selected pages do not exist.')
  }

  const output = await PDFDocument.create()
  const pages = await output.copyPages(document, pageIndices)
  for (const page of pages) output.addPage(page)
  return output.save()
}

export async function organizePdf(
  data: ArrayBuffer,
  operations: PdfPageOperation[],
): Promise<Uint8Array> {
  const { PDFDocument, document } = await loadPdf(data)
  const { degrees } = await import('pdf-lib')
  if (operations.length === 0) throw new ConversionError('Keep at least one page in the PDF.')
  if (operations.some(({ sourceIndex }) => sourceIndex < 0 || sourceIndex >= document.getPageCount())) {
    throw new ConversionError('The PDF page list is invalid.', 'Try selecting the file again.')
  }

  const output = await PDFDocument.create()
  const pages = await output.copyPages(document, operations.map(({ sourceIndex }) => sourceIndex))
  for (const [index, page] of pages.entries()) {
    const rotation = operations[index].rotation
    if (rotation) page.setRotation(degrees(rotation))
    output.addPage(page)
  }
  return output.save()
}

export function parsePageRanges(value: string, pageCount: number): number[] {
  const pages: number[] = []
  for (const part of value.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const range = trimmed.split('-').map((item) => Number.parseInt(item.trim(), 10))
    if (range.some((page) => !Number.isInteger(page))) return []
    const start = range[0]
    const end = range[1] ?? start
    if (start < 1 || end < start || end > pageCount) return []
    for (let page = start; page <= end; page += 1) pages.push(page)
  }
  return [...new Set(pages)]
}
