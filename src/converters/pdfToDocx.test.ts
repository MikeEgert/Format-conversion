import { describe, expect, it } from 'vitest'
import { unzipSync } from 'fflate'
import { strFromU8 } from 'fflate'
import { ConversionError } from './types'
import { itemsToLines, itemsToBlocks, blocksToDocx, pdfToDocx, pdfErrorToConversionError, isOutOfMemoryError } from './pdfToDocx'
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

  it('keeps side-by-side columns in reading order instead of interleaving', () => {
    const items = [
      { str: 'Left one', transform: [10, 0, 0, 10, 10, 720], width: 40 },
      { str: 'Right one', transform: [10, 0, 0, 10, 300, 720], width: 40 },
      { str: 'Left two', transform: [10, 0, 0, 10, 10, 700], width: 40 },
      { str: 'Right two', transform: [10, 0, 0, 10, 300, 700], width: 40 },
    ]
    expect(itemsToLines(items)).toEqual(['Left one', 'Left two', 'Right one', 'Right two'])
  })

  it('separates three columns left to right', () => {
    const items = [
      { str: 'A1', transform: [10, 0, 0, 10, 10, 720], width: 20 },
      { str: 'B1', transform: [10, 0, 0, 10, 200, 720], width: 20 },
      { str: 'C1', transform: [10, 0, 0, 10, 400, 720], width: 20 },
      { str: 'A2', transform: [10, 0, 0, 10, 10, 700], width: 20 },
      { str: 'B2', transform: [10, 0, 0, 10, 200, 700], width: 20 },
      { str: 'C2', transform: [10, 0, 0, 10, 400, 700], width: 20 },
    ]
    expect(itemsToLines(items)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  })

  it('does not split on a lone far-right item (e.g. a page number)', () => {
    const items = [
      { str: 'Body text', transform: [10, 0, 0, 10, 10, 720], width: 80 },
      { str: 'More body', transform: [10, 0, 0, 10, 10, 700], width: 80 },
      { str: '1', transform: [10, 0, 0, 10, 400, 720], width: 5 },
    ]
    expect(itemsToLines(items)).toEqual(['Body text 1', 'More body'])
  })
})

describe('linesToDocx', () => {
  it('produces a valid docx zip containing the extracted text', () => {
    const pages = [
      [
        { type: 'paragraph' as const, text: 'Hello World' },
        { type: 'paragraph' as const, text: 'Second line' },
      ],
      [{ type: 'paragraph' as const, text: 'Page two' }],
    ]
    const bytes = blocksToDocx(pages, 'report.pdf')

    const files = unzipSync(bytes)
    const documentXml = strFromU8(files['word/document.xml'])

    expect(documentXml).toContain('Hello World')
    expect(documentXml).toContain('Second line')
    expect(documentXml).toContain('Page two')
    expect(files['[Content_Types].xml']).toBeDefined()
    expect(files['_rels/.rels']).toBeDefined()
  })

  it('escapes XML-special characters in the text', () => {
    const bytes = blocksToDocx([[{ type: 'paragraph', text: 'Tom & Jerry <3 "quotes"' }]], 'x.pdf')
    const documentXml = strFromU8(unzipSync(bytes)['word/document.xml'])
    expect(documentXml).toContain('Tom &amp; Jerry &lt;3 &quot;quotes&quot;')
  })

  it('separates pages with a page break', () => {
    const bytes = blocksToDocx(
      [[{ type: 'paragraph', text: 'a' }], [{ type: 'paragraph', text: 'b' }]],
      'x.pdf',
    )
    const documentXml = strFromU8(unzipSync(bytes)['word/document.xml'])
    const pageBreaks = documentXml.split('w:type="page"').length - 1
    expect(pageBreaks).toBe(1)
  })

  it('renders table blocks as DOCX tables', () => {
    const bytes = blocksToDocx(
      [[{ type: 'table', rows: [['Name', 'Age'], ['Alice', '30']] }]],
      'x.pdf',
    )
    const documentXml = strFromU8(unzipSync(bytes)['word/document.xml'])
    expect(documentXml).toContain('<w:tbl>')
    expect(documentXml).toContain('Name')
    expect(documentXml).toContain('Alice')
    expect(documentXml).toContain('<w:gridCol')
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
    const err = pdfErrorToConversionError(new Error('something else'), pdfjs)
    expect(err.message).toBe('Could not read this PDF.')
    expect(err.hint).not.toContain('scanned')
  })

  it('reports an out-of-memory error specifically', () => {
    const err = pdfErrorToConversionError(new RangeError('out of memory'), pdfjs)
    expect(err.message).toBe('This PDF is too large to process in your browser.')
    expect(err.hint).toContain('memory')
  })
})

describe('isOutOfMemoryError', () => {
  it('detects allocation-failure RangeErrors', () => {
    expect(isOutOfMemoryError(new RangeError('Array buffer allocation failed'))).toBe(true)
    expect(isOutOfMemoryError(new RangeError('Invalid string length'))).toBe(true)
    expect(isOutOfMemoryError(new RangeError('WebAssembly.Memory.grow(): Out of memory'))).toBe(true)
  })

  it('rejects non-OOM RangeErrors and other error types', () => {
    expect(isOutOfMemoryError(new RangeError('Invalid array length'))).toBe(false)
    expect(isOutOfMemoryError(new Error('out of memory'))).toBe(false)
    expect(isOutOfMemoryError('out of memory')).toBe(false)
  })
})

describe('itemsToBlocks', () => {
  it('detects a simple grid table and emits a table block', () => {
    const items = [
      { str: 'Name', transform: [10, 0, 0, 10, 10, 720], width: 40 },
      { str: 'Age', transform: [10, 0, 0, 10, 70, 720], width: 30 },
      { str: 'Alice', transform: [10, 0, 0, 10, 10, 700], width: 40 },
      { str: '30', transform: [10, 0, 0, 10, 70, 700], width: 20 },
    ]
    expect(itemsToBlocks(items)).toEqual([{ type: 'table', rows: [['Name', 'Age'], ['Alice', '30']] }])
  })

  it('leaves normal text as paragraph blocks', () => {
    const items = [
      { str: 'Hello', transform: [10, 0, 0, 10, 10, 720], width: 40 },
      { str: 'World', transform: [10, 0, 0, 10, 60, 720], width: 40 },
    ]
    expect(itemsToBlocks(items)).toEqual([{ type: 'paragraph', text: 'Hello World' }])
  })

  it('does not treat wide-guttered side-by-side columns as a table', () => {
    const items = [
      { str: 'Left one', transform: [10, 0, 0, 10, 10, 720], width: 40 },
      { str: 'Right one', transform: [10, 0, 0, 10, 300, 720], width: 40 },
      { str: 'Left two', transform: [10, 0, 0, 10, 10, 700], width: 40 },
      { str: 'Right two', transform: [10, 0, 0, 10, 300, 700], width: 40 },
    ]
    expect(itemsToBlocks(items)).toEqual([
      { type: 'paragraph', text: 'Left one' },
      { type: 'paragraph', text: 'Left two' },
      { type: 'paragraph', text: 'Right one' },
      { type: 'paragraph', text: 'Right two' },
    ])
  })

  it('interleaves a table with surrounding paragraphs by vertical position', () => {
    const items = [
      { str: 'Intro', transform: [10, 0, 0, 10, 10, 760], width: 40 },
      { str: 'Name', transform: [10, 0, 0, 10, 10, 720], width: 40 },
      { str: 'Age', transform: [10, 0, 0, 10, 70, 720], width: 30 },
      { str: 'Alice', transform: [10, 0, 0, 10, 10, 700], width: 40 },
      { str: '30', transform: [10, 0, 0, 10, 70, 700], width: 20 },
      { str: 'Footer', transform: [10, 0, 0, 10, 10, 660], width: 40 },
    ]
    expect(itemsToBlocks(items)).toEqual([
      { type: 'paragraph', text: 'Intro' },
      { type: 'table', rows: [['Name', 'Age'], ['Alice', '30']] },
      { type: 'paragraph', text: 'Footer' },
    ])
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
