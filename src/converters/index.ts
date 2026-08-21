import { ConversionError, type Converter } from './types'
import { csvToJson } from './csvToJson'
import { docxToMarkdown } from './docxToMarkdown'
import { heicToJpg } from './heicToJpg'
import { imageConvert } from './imageConvert'

export const converters: Converter[] = [imageConvert, heicToJpg, docxToMarkdown, csvToJson]

export { csvToJson, docxToMarkdown, heicToJpg, imageConvert }
export { ConversionError }
export type { Converter, ConversionResult, ImageFormat, ImageFormatOption } from './types'
