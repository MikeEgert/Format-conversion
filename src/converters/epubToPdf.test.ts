import { describe, expect, it } from 'vitest'
import { strToU8, zipSync } from 'fflate'
import { ConversionError } from './types'
import {
  assertEpubUncompressedSize,
  assertNotDrm,
  htmlToBlocks,
  parseEpub,
  resolveHref,
  sanitizeForFont,
} from './epubContent'
import { DEFAULT_PAGE_CONFIG, layoutBlocks, type FontMetrics } from './epubLayout'
import { epubToPdf } from './epubToPdf'

const CONTAINER = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`

function buildOpf(title: string, author: string, items: string, spine: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
  </metadata>
  <manifest>${items}</manifest>
  <spine>${spine}</spine>
</package>`
}

function buildEpub(files: Record<string, string | Uint8Array>): Uint8Array<ArrayBuffer> {
  const zippable: Record<string, Uint8Array> = {}
  for (const [key, value] of Object.entries(files)) {
    zippable[key] = typeof value === 'string' ? strToU8(value) : value
  }
  return zipSync(zippable)
}

function minimalEpub(chapterHtml = '<h1>Chapter</h1><p>Hello world.</p>'): Uint8Array<ArrayBuffer> {
  const opf = buildOpf(
    'Test Book',
    'Test Author',
    '<item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>',
    '<itemref idref="ch1"/>',
  )
  return buildEpub({
    'META-INF/container.xml': CONTAINER,
    'OEBPS/content.opf': opf,
    'OEBPS/ch1.xhtml': `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"><body>${chapterHtml}</body></html>`,
  })
}

const monospaceMeasure: FontMetrics = {
  width: (text, size) => text.length * size * 0.5,
}

describe('resolveHref', () => {
  it('resolves relative to a base directory', () => {
    expect(resolveHref('OEBPS/text', '../images/cover.png')).toBe('OEBPS/images/cover.png')
    expect(resolveHref('OEBPS', 'ch1.xhtml')).toBe('OEBPS/ch1.xhtml')
  })

  it('strips fragments and query strings', () => {
    expect(resolveHref('OEBPS', 'ch1.xhtml#part')).toBe('OEBPS/ch1.xhtml')
  })
})

describe('assertNotDrm', () => {
  it('allows a file without encryption', () => {
    expect(() => assertNotDrm({ 'OEBPS/ch1.xhtml': new Uint8Array() })).not.toThrow()
  })

  it('rejects a DRM-protected epub', () => {
    expect(() => assertNotDrm({ 'META-INF/encryption.xml': new Uint8Array() })).toThrowError(
      ConversionError,
    )
  })
})

describe('assertEpubUncompressedSize', () => {
  it('allows a zip under the cap', () => {
    const zip = zipSync({ 'a.txt': strToU8('hello world') })
    expect(() => assertEpubUncompressedSize(zip)).not.toThrow()
  })

  it('rejects a zip that expands beyond the cap', () => {
    const zip = zipSync({ 'a.txt': strToU8('hello world') })
    expect(() => assertEpubUncompressedSize(zip, 10)).toThrowError(ConversionError)
  })
})

describe('parseEpub', () => {
  it('reads title, author, and chapters', () => {
    const pkg = parseEpub(minimalEpub())
    expect(pkg.title).toBe('Test Book')
    expect(pkg.author).toBe('Test Author')
    expect(pkg.chapters.map((c) => c.path)).toEqual(['OEBPS/ch1.xhtml'])
  })

  it('rejects a non-zip file', () => {
    expect(() => parseEpub(strToU8('not an epub'))).toThrowError(ConversionError)
  })

  it('rejects a DRM-protected epub', () => {
    const files = {
      'META-INF/container.xml': CONTAINER,
      'META-INF/encryption.xml': '<encryption/>',
    }
    expect(() => parseEpub(buildEpub(files))).toThrowError(ConversionError)
  })

  it('rejects a missing container', () => {
    expect(() => parseEpub(buildEpub({ 'OEBPS/content.opf': '' }))).toThrowError(ConversionError)
  })
})

describe('htmlToBlocks', () => {
  it('extracts headings and paragraphs', () => {
    const blocks = htmlToBlocks('<h1>Title</h1><p>Hello <strong>bold</strong> world.</p>')
    expect(blocks[0]).toMatchObject({ kind: 'heading', level: 1 })
    expect(blocks[1].kind).toBe('paragraph')
  })

  it('drops script and style content', () => {
    const blocks = htmlToBlocks('<p>Safe</p><script>alert("x")</script><style>p{}</style>')
    const text = blocks.map((b) => (b.kind === 'paragraph' ? b.runs.map((r) => r.text).join('') : '')).join('')
    expect(text).not.toContain('alert')
    expect(text).not.toContain('p{}')
  })

  it('preserves inline formatting', () => {
    const blocks = htmlToBlocks('<p><em>a</em>b<strong>c</strong></p>')
    const p = blocks[0]
    if (p.kind !== 'paragraph') throw new Error('expected paragraph')
    expect(p.runs.some((r) => r.text === 'a' && r.italic)).toBe(true)
    expect(p.runs.some((r) => r.text === 'c' && r.bold)).toBe(true)
  })

  it('flattens lists into list items', () => {
    const blocks = htmlToBlocks('<ol><li>One</li><li>Two</li></ol>')
    expect(blocks.every((b) => b.kind === 'listItem')).toBe(true)
    expect(blocks[0]).toMatchObject({ ordered: true, index: 1 })
  })
})

describe('layoutBlocks', () => {  it('wraps a long paragraph across lines', () => {
    const words = 'word '.repeat(200).trim()
    const blocks = [{ kind: 'paragraph' as const, runs: [{ text: words }] }]
    const pages = layoutBlocks(blocks, DEFAULT_PAGE_CONFIG, monospaceMeasure)
    const textItems = pages.flatMap((p) => p.items.filter((i) => i.kind === 'text'))
    expect(textItems.length).toBeGreaterThan(1)
  })

  it('starts a new page for a page break', () => {
    const blocks = [
      { kind: 'paragraph' as const, runs: [{ text: 'first' }] },
      { kind: 'pageBreak' as const },
      { kind: 'paragraph' as const, runs: [{ text: 'second' }] },
    ]
    const pages = layoutBlocks(blocks, DEFAULT_PAGE_CONFIG, monospaceMeasure)
    expect(pages.length).toBe(2)
    expect(pages[0].items[0]).toMatchObject({ text: 'first' })
    expect(pages[1].items[0]).toMatchObject({ text: 'second' })
  })

  it('flows content onto a new page when the page is full', () => {
    const blocks = []
    for (let i = 0; i < 400; i += 1) {
      blocks.push({ kind: 'paragraph' as const, runs: [{ text: `line ${i}` }] })
    }
    const pages = layoutBlocks(blocks, DEFAULT_PAGE_CONFIG, monospaceMeasure)
    expect(pages.length).toBeGreaterThan(1)
  })

  it('adds a marker to ordered list items', () => {
    const blocks = [{ kind: 'listItem' as const, ordered: true, index: 3, runs: [{ text: 'item' }] }]
    const pages = layoutBlocks(blocks, DEFAULT_PAGE_CONFIG, monospaceMeasure)
    const texts = pages.flatMap((p) => p.items.filter((i) => i.kind === 'text'))
    expect(texts.some((t) => t.text === '3. ')).toBe(true)
  })
})

describe('sanitizeForFont', () => {
  it('maps horizontal bar to em dash in WinAnsi-only mode', () => {
    expect(sanitizeForFont('a\u2015b', true)).toBe('a\u2014b')
  })

  it('keeps characters when a Unicode font is available', () => {
    expect(sanitizeForFont('a\u2015b', false)).toBe('a\u2015b')
  })

  it('strips control characters', () => {
    expect(sanitizeForFont('a\u0000b', false)).toBe('ab')
  })

  it('replaces non-breaking space with a regular space', () => {
    expect(sanitizeForFont('a\u00a0b', false)).toBe('a b')
  })
})

describe('epubToPdf.convert', () => {
  it('produces a PDF end-to-end', async () => {
    const file = new File([minimalEpub()], 'book.epub')
    const result = await epubToPdf.convert(file)

    expect(result.filename).toBe('book.pdf')
    expect(result.blob.type).toBe('application/pdf')

    const bytes = new Uint8Array(await result.blob.arrayBuffer())
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4])).toBe('%PDF-')
  })

  it('rejects a DRM-protected epub', async () => {
    const files = {
      'META-INF/container.xml': CONTAINER,
      'META-INF/encryption.xml': '<encryption/>',
    }
    const file = new File([buildEpub(files)], 'drm.epub')
    await expect(epubToPdf.convert(file)).rejects.toThrowError(ConversionError)
  })

  it('rejects a non-zip file', async () => {
    const file = new File(['not an epub'], 'fake.epub')
    await expect(epubToPdf.convert(file)).rejects.toThrowError(ConversionError)
  })

  it('converts text with characters outside WinAnsi', async () => {
    const epub = minimalEpub('<p>a\u2015b \u2014 c</p>')
    const file = new File([epub], 'dash.epub')
    const result = await epubToPdf.convert(file)
    expect(result.blob.type).toBe('application/pdf')
  })
})
