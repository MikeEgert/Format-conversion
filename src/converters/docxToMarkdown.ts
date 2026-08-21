import { isZipFile, replaceExtension } from './helpers'
import { ConversionError, type Converter } from './types'

export const docxToMarkdown: Converter = {
  id: 'docx-to-markdown',
  name: 'DOCX to Markdown',
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

    try {
      const mammoth = (await import('mammoth')).default
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer })

      const TurndownService = (await import('turndown')).default
      const turndown = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
      })
      const markdown = turndown.turndown(html)

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
