import { ConversionError, type Converter } from './types'
import { csvToJson } from './csvToJson'
import { docxToMarkdown } from './docxToMarkdown'
import { epubToPdf } from './epubToPdf'
import { heicToJpg } from './heicToJpg'
import { imageConvert } from './imageConvert'
import { jsonToCsv } from './jsonToCsv'
import { pdfToDocx } from './pdfToDocx'

export const converters: Converter[] = [
  imageConvert,
  heicToJpg,
  docxToMarkdown,
  pdfToDocx,
  epubToPdf,
  csvToJson,
  jsonToCsv,
]

export { csvToJson, docxToMarkdown, epubToPdf, heicToJpg, imageConvert, jsonToCsv, pdfToDocx }
export { ConversionError }
export type { Converter, ConversionResult, ImageFormat, ImageFormatOption } from './types'
