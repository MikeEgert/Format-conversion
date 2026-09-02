import { describe, expect, it } from 'vitest'
import { unzipSync } from 'fflate'
import { strFromU8 } from 'fflate'
import { ConversionError } from './types'
import { itemsToLines, linesToDocx, pdfToDocx, pdfErrorToConversionError } from './pdfToDocx'
import { isPdfFile } from './helpers'

describe('isPdfFile', () => {
  it('detects the %PDF magic bytes', () => {
    const buffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
    expect(isPdfFile(buffer.buffer)).toBe(true)
  })

  it('rejects non-PDF data', () => {
    expect(isPdfFile(new TextEncoder().encode('hello world').buffer)).toBe(false)
    expect(isPdfFile(new ArrayBuffer(0))).toBe(false)
  })
})

describe('itemsToLines', () => {
  it('groups items on the same baseline into a line in reading order', () => {
    const items = [
      { str: 'World', transform: [10, 0, 0, 10, 50, 720], width: 30 },
      { str: 'Hello', transform: [10, 0, 0, 10, 10, 720], width: 28 },
      { str: 'Done', transform: [10, 0, 0, 10, 10, 700], width: 26 },
    ]
    expect(itemsToLines(items)).toEqual(['Hello World', 'Done'])
  })

  it('skips items without text or coordinates', () => {
    const items = [
      { str: '' },
      { transform: undefined },
      { type: 'beginMarkedContent', id: 'M1' },
      { str: 'only', transform: [1, 0, 0, 1, 0, 0], width: 4 },
    ]
    expect(itemsToLines(items)).toEqual(['only'])
  })

  it('inserts a space when the horizontal gap is wider than a character', () => {
    const items = [
      { str: 'ab', transform: [10, 0, 0, 10, 0, 100], width: 20 },
      { str: 'cd', transform: [10, 0, 0, 10, 60, 100], width: 20 },
    ]
    // gap (60-20=40) exceeds avg char width (10) -> a space is inserted
    expect(itemsToLines(items)).toEqual(['ab cd'])
  })

  it('handles a line break via a different baseline', () => {
    const items = [
      { str: 'First', transform: [10, 0, 0, 10, 0, 100], width: 30 },
      { str: 'Second', transform: [10, 0, 0, 10, 0, 60], width: 40 },
    ]
    expect(itemsToLines(items)).toEqual(['First', 'Second'])
  })
})

describe('linesToDocx', () => {
  it('produces a valid docx zip containing the extracted text', () => {
    const pages = [['Hello World', 'Second line'], ['Page two']]
    const bytes = linesToDocx(pages, 'report.pdf')

    const files = unzipSync(bytes)
    const documentXml = strFromU8(files['word/document.xml'])

    expect(documentXml).toContain('Hello World')
    expect(documentXml).toContain('Second line')
    expect(documentXml).toContain('Page two')
    expect(files['[Content_Types].xml']).toBeDefined()
    expect(files['_rels/.rels']).toBeDefined()
  })

  it('escapes XML-special characters in the text', () => {
    const bytes = linesToDocx([['Tom & Jerry <3 "quotes"']], 'x.pdf')
    const documentXml = strFromU8(unzipSync(bytes)['word/document.xml'])
    expect(documentXml).toContain('Tom &amp; Jerry &lt;3 &quot;quotes&quot;')
  })

  it('separates pages with a page break', () => {
    const bytes = linesToDocx([['a'], ['b']], 'x.pdf')
    const documentXml = strFromU8(unzipSync(bytes)['word/document.xml'])
    const pageBreaks = documentXml.split('w:type="page"').length - 1
    expect(pageBreaks).toBe(1)
  })
})

describe('pdfErrorToConversionError', () => {
  class PasswordException extends Error {}
  class InvalidPDFException extends Error {}
  const pdfjs = { PasswordException, InvalidPDFException }

  it('reports password-protected PDFs', () => {
    const err = pdfErrorToConversionError(new PasswordException('x'), pdfjs)
    expect(err.message).toBe('This PDF is password-protected.')
    expect(err.hint).toContain('password')
  })

  it('reports corrupted or invalid PDFs', () => {
    const err = pdfErrorToConversionError(new InvalidPDFException('x'), pdfjs)
    expect(err.message).toBe('This PDF is corrupted or invalid.')
  })

  it('falls back to a generic message for unknown errors', () => {
    const err = pdfErrorToConversionError(new RangeError('out of memory'), pdfjs)
    expect(err.message).toBe('Could not read this PDF.')
    expect(err.hint).not.toContain('scanned')
  })
})

describe('pdfToDocx.convert', () => {
  it('rejects a file that is not a PDF', async () => {
    const file = new File(['this is not a pdf'], 'notes.pdf')
    await expect(pdfToDocx.convert(file)).rejects.toThrowError(ConversionError)
  })

  it('rejects an empty file', async () => {
    const file = new File([], 'empty.pdf')
    await expect(pdfToDocx.convert(file)).rejects.toThrowError(ConversionError)
  })
})
