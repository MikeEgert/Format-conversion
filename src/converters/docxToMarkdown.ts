import { unzipSync, type UnzipFileInfo } from 'fflate'
import { isZipFile, replaceExtension } from './helpers'
import { ConversionError, type Converter } from './types'

export const MAX_DOCX_UNCOMPRESSED_BYTES = 256 * 1024 * 1024

export function assertDocxUncompressedSize(
  data: Uint8Array,
  maxBytes = MAX_DOCX_UNCOMPRESSED_BYTES,
): void {
  let total = 0
  try {
    unzipSync(data, {
      filter(file: UnzipFileInfo) {
        total += file.originalSize
        return false
      },
    })
  } catch {
    throw new ConversionError(
      'Could not read this .docx file.',
      'The file may be corrupted or password-protected. Try opening and re-saving it in Word.',
    )
  }

  if (total > maxBytes) {
    const limit = Math.floor(maxBytes / (1024 * 1024))
    throw new ConversionError(
      `This document expands to over ${limit} MB, which is too large to convert.`,
      'Try removing embedded images or splitting the document.',
    )
  }
}

export async function htmlToMarkdown(html: string): Promise<string> {
  const TurndownService = (await import('turndown')).default
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  })
  return turndown.turndown(html)
}

export const docxToMarkdown: Converter = {
  id: 'docx-to-markdown',
  name: 'DOCX to Markdown',
  category: 'Documents',
  fromLabel: 'DOCX',
  toLabel: 'MD',
  description: 'Convert Word documents into clean Markdown for notes and blogs.',
  detail: {
    about:
      'Turn Word documents into clean Markdown for notes, blogs, and wikis. Headings, lists, and code blocks come through clean, without the formatting cruft.',
    useCases: [
      'Move a Word doc into a notes app or blog that uses Markdown',
      'Strip formatting to plain, portable text',
      'Get a clean, editable version of a report',
    ],
    accepts: ['DOCX'],
  },
  accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  outputType: 'text/markdown',
  async convert(file) {
    const arrayBuffer = await file.arrayBuffer()
    if (!isZipFile(arrayBuffer)) {
      throw new ConversionError(
        "This isn't a valid .docx file.",
        'A .docx is actually a ZIP archive. Old .doc files or renamed files won\'t work — open it in Word or Google Docs and re-save it as ".docx".',
      )
    }

    assertDocxUncompressedSize(new Uint8Array(arrayBuffer))

    try {
      const mammoth = (await import('mammoth')).default
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer })
      const markdown = await htmlToMarkdown(html)

      return {
        blob: new Blob([markdown], { type: 'text/markdown' }),
        filename: replaceExtension(file.name, 'md'),
      }
    } catch {
      throw new ConversionError(
        'Could not read this .docx file.',
        'The file may be corrupted or password-protected. Try opening and re-saving it in Word.',
      )
    }
  },
}
