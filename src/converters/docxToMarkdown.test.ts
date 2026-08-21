import { describe, expect, it, vi } from 'vitest'
import { strToU8, zipSync } from 'fflate'
import { ConversionError } from './types'
import { docxToMarkdown, htmlToMarkdown } from './docxToMarkdown'

vi.mock('mammoth', () => ({
  default: { convertToHtml: async () => ({ value: '<p>Hello World</p>' }) },
}))

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`

const BODY = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:t>Hello World</w:t></w:r></w:p>
</w:body>
</w:document>`

function buildDocx(bodyXml: string) {
  return zipSync({
    '[Content_Types].xml': strToU8(CONTENT_TYPES),
    '_rels/.rels': strToU8(RELS),
    'word/_rels/document.xml.rels': strToU8(DOCUMENT_RELS),
    'word/document.xml': strToU8(bodyXml),
  })
}

describe('htmlToMarkdown', () => {
  it('converts headings and bold text', async () => {
    const markdown = await htmlToMarkdown('<h1>Title</h1><p>Hello <strong>bold</strong></p>')
    expect(markdown).toContain('# Title')
    expect(markdown).toContain('Hello **bold**')
  })
})

describe('docxToMarkdown.convert', () => {
  it('converts a valid .docx into markdown', async () => {
    const file = new File([buildDocx(BODY)], 'notes.docx')
    const result = await docxToMarkdown.convert(file)

    expect(result.filename).toBe('notes.md')
    expect(result.blob.type).toBe('text/markdown')
    expect(await result.blob.text()).toContain('Hello World')
  })

  it('rejects a file that is not a zip archive', async () => {
    const file = new File(['this is not a docx'], 'notes.docx')
    await expect(docxToMarkdown.convert(file)).rejects.toThrowError(ConversionError)
  })
})
