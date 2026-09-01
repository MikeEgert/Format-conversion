import type { PDFDocument, PDFFont, PDFPage, RGB } from 'pdf-lib'
import { ConversionError, type Converter } from './types'
import { isZipFile, replaceExtension } from './helpers'
import {
  assertEpubUncompressedSize,
  decodeText,
  dirOf,
  htmlToBlocks,
  parseEpub,
  resolveImage,
  sanitizeForFont,
  type Block,
  type TextStyle,
} from './epubContent'
import { DEFAULT_PAGE_CONFIG, layoutBlocks, type FontMetrics, type Page } from './epubLayout'

export const epubToPdf: Converter = {
  id: 'epub-to-pdf',
  name: 'EPUB to PDF',
  category: 'E-books',
  fromLabel: 'EPUB',
  toLabel: 'PDF',
  description: 'Convert e-books into selectable, print-ready PDF files.',
  detail: {
    about:
      'Turn EPUB e-books into clean, text-layered PDFs you can read, print, or annotate anywhere. DRM-protected books are detected and refused.',
    useCases: [
      'Read an e-book on a device or app that only accepts PDF',
      'Print or annotate a book',
      'Keep a portable copy for archiving',
    ],
    accepts: ['EPUB'],
  },
  accept: '.epub,application/epub+zip',
  outputType: 'application/pdf',
  async convert(file) {
    const arrayBuffer = await file.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)

    if (!isZipFile(arrayBuffer)) {
      throw new ConversionError(
        "This isn't a valid EPUB.",
        'An EPUB is a ZIP archive. Make sure you picked a real .epub file.',
      )
    }

    assertEpubUncompressedSize(data)
    const pkg = parseEpub(data)

    const blocks: Block[] = []
    if (pkg.title) blocks.push({ kind: 'heading', level: 1, runs: [{ text: pkg.title, bold: true }] })
    if (pkg.author) blocks.push({ kind: 'paragraph', runs: [{ text: pkg.author, italic: true }] })
    if (pkg.title || pkg.author) blocks.push({ kind: 'pageBreak' })

    for (const chapter of pkg.chapters) {
      const raw = pkg.files[chapter.path]
      if (!raw) continue
      const chapterBlocks = htmlToBlocks(decodeText(raw))
      const chapterDir = dirOf(chapter.path)
      for (const block of chapterBlocks) {
        if (block.kind === 'image') {
          block.image = resolveImage(pkg.files, chapterDir, block.src)
        }
      }
      if (chapterBlocks.length === 0) continue
      blocks.push(...chapterBlocks)
      blocks.push({ kind: 'pageBreak' })
    }

    if (blocks.length === 0) {
      throw new ConversionError(
        'This EPUB has no readable content.',
        'The book may be empty or use an unsupported structure.',
      )
    }

    const pdfBytes = await buildPdf(blocks, { title: pkg.title, author: pkg.author })
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: replaceExtension(file.name, 'pdf'),
    }
  },
}

async function buildPdf(
  blocks: Block[],
  meta: { title?: string; author?: string },
): Promise<Uint8Array<ArrayBuffer>> {
  const { PDFDocument: PDFDocumentFactory, StandardFonts, rgb } = await import('pdf-lib')

  const doc = await PDFDocumentFactory.create()
  doc.setTitle(meta.title ?? 'Converted EPUB')
  if (meta.author) doc.setAuthor(meta.author)
  doc.setCreator('FoldenLoom')
  doc.setProducer('FoldenLoom')

  const { fontFor, winAnsiOnly } = await loadFonts(doc, StandardFonts)

  for (const block of blocks) {
    if ('runs' in block) {
      for (const run of block.runs) {
        run.text = sanitizeForFont(run.text, winAnsiOnly)
      }
    }
  }

  const measure: FontMetrics = {
    width: (text, size, style) => fontFor(style).widthOfTextAtSize(text, size),
  }

  const pages = layoutBlocks(blocks, DEFAULT_PAGE_CONFIG, measure)
  const config = DEFAULT_PAGE_CONFIG

  for (const page of pages) {
    const pdfPage = doc.addPage([config.pageWidth, config.pageHeight])
    await drawPage(doc, pdfPage, page, fontFor, rgb)
  }

  return new Uint8Array(await doc.save())
}

interface LoadedFonts {
  winAnsiOnly: boolean
  fontFor: (style: TextStyle) => PDFFont
}

async function loadFonts(
  doc: PDFDocument,
  StandardFonts: typeof import('pdf-lib').StandardFonts,
): Promise<LoadedFonts> {
  try {
    const fontkit = (await import('@pdf-lib/fontkit')).default
    doc.registerFontkit(fontkit)
    const base = import.meta.env.BASE_URL
    const load = (name: string) => fetch(`${base}fonts/${name}`).then((r) => r.arrayBuffer())
    return {
      winAnsiOnly: false,
      fontFor: makeFontFor({
        regular: await doc.embedFont(await load('NotoSerif-Regular.ttf')),
        bold: await doc.embedFont(await load('NotoSerif-Bold.ttf')),
        italic: await doc.embedFont(await load('NotoSerif-Italic.ttf')),
        boldItalic: await doc.embedFont(await load('NotoSerif-BoldItalic.ttf')),
      }),
    }
  } catch {
    return {
      winAnsiOnly: true,
      fontFor: makeFontFor({
        regular: await doc.embedFont(StandardFonts.TimesRoman),
        bold: await doc.embedFont(StandardFonts.TimesRomanBold),
        italic: await doc.embedFont(StandardFonts.TimesRomanItalic),
        boldItalic: await doc.embedFont(StandardFonts.TimesRomanBoldItalic),
      }),
    }
  }
}

function makeFontFor(fonts: {
  regular: PDFFont
  bold: PDFFont
  italic: PDFFont
  boldItalic: PDFFont
}): (style: TextStyle) => PDFFont {
  return (style: TextStyle): PDFFont => {
    if (style.bold && style.italic) return fonts.boldItalic
    if (style.bold) return fonts.bold
    if (style.italic) return fonts.italic
    return fonts.regular
  }
}

async function drawPage(
  doc: PDFDocument,
  pdfPage: PDFPage,
  page: Page,
  fontFor: (style: TextStyle) => PDFFont,
  rgb: (r: number, g: number, b: number) => RGB,
): Promise<void> {
  const config = DEFAULT_PAGE_CONFIG

  for (const item of page.items) {
    if (item.kind === 'text') {
      const font = fontFor(item.style)
      const baselineY = config.pageHeight - item.yTop - item.size
      const y =
        item.vertical === 'sup'
          ? baselineY + item.size * 0.35
          : item.vertical === 'sub'
            ? baselineY - item.size * 0.25
            : baselineY
      pdfPage.drawText(item.text, {
        x: item.x,
        y,
        size: item.size,
        font,
        color: rgb(0, 0, 0),
      })
    } else if (item.kind === 'image') {
      const embedded =
        item.image.mime === 'image/png'
          ? await doc.embedPng(item.image.bytes)
          : await doc.embedJpg(item.image.bytes)
      pdfPage.drawImage(embedded, {
        x: item.x,
        y: config.pageHeight - item.yTop - item.height,
        width: item.width,
        height: item.height,
      })
    } else {
      pdfPage.drawLine({
        start: { x: item.x, y: config.pageHeight - item.yTop },
        end: { x: item.x + item.width, y: config.pageHeight - item.yTop },
        thickness: 1,
        color: rgb(0, 0, 0),
      })
    }
  }
}
