import { ConversionError, type Converter } from './types'
import { csvToJson } from './csvToJson'
import { docxToMarkdown } from './docxToMarkdown'
import { epubToPdf } from './epubToPdf'
import { heicToJpg } from './heicToJpg'
import { imageConvert } from './imageConvert'
import { jsonToCsv } from './jsonToCsv'

export const converters: Converter[] = [imageConvert, heicToJpg, docxToMarkdown, epubToPdf, csvToJson, jsonToCsv]

export { csvToJson, docxToMarkdown, epubToPdf, heicToJpg, imageConvert, jsonToCsv }
export { ConversionError }
export type { Converter, ConversionResult, ImageFormat, ImageFormatOption } from './types'
