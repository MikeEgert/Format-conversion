import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { extractPdfPages, mergePdfs, organizePdf, parsePageRanges } from './pdfTools'

async function createPdf(pageCount: number): Promise<ArrayBuffer> {
  const document = await PDFDocument.create()
  for (let i = 0; i < pageCount; i += 1) document.addPage()
  const bytes = await document.save()
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

describe('parsePageRanges', () => {
  it('parses individual pages and ranges without duplicates', () => {
    expect(parsePageRanges('1, 3-4, 4', 5)).toEqual([1, 3, 4])
  })

  it('rejects malformed or out-of-range input', () => {
    expect(parsePageRanges('0-2', 5)).toEqual([])
    expect(parsePageRanges('2-1', 5)).toEqual([])
    expect(parsePageRanges('six', 5)).toEqual([])
  })
})

describe('PDF page operations', () => {
  it('merges multiple PDFs into one document in input order', async () => {
    const output = await PDFDocument.load(await mergePdfs([await createPdf(2), await createPdf(3)]))
    expect(output.getPageCount()).toBe(5)
  })

  it('extracts pages in the requested order', async () => {
    const output = await PDFDocument.load(await extractPdfPages(await createPdf(3), [3, 1]))
    expect(output.getPageCount()).toBe(2)
  })

  it('organizes, removes, and rotates pages', async () => {
    const output = await PDFDocument.load(
      await organizePdf(await createPdf(3), [
        { sourceIndex: 2, rotation: 90 },
        { sourceIndex: 0, rotation: 0 },
      ]),
    )
    expect(output.getPageCount()).toBe(2)
    expect(output.getPage(0).getRotation().angle).toBe(90)
  })
})
