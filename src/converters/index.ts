import { ConversionError, type Converter } from './types'
import { csvToJson } from './csvToJson'
import { docxToMarkdown } from './docxToMarkdown'
import { heicToJpg } from './heicToJpg'
import { imageConvert } from './imageConvert'
import { jsonToCsv } from './jsonToCsv'

export const converters: Converter[] = [imageConvert, heicToJpg, docxToMarkdown, csvToJson, jsonToCsv]

export { csvToJson, docxToMarkdown, heicToJpg, imageConvert, jsonToCsv }
export { ConversionError }
export type { Converter, ConversionResult, ImageFormat, ImageFormatOption } from './types'
