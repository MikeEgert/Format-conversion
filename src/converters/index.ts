import { ConversionError, type Converter } from './types'
import { csvToJson } from './csvToJson'
import { docxToMarkdown } from './docxToMarkdown'
import { heicToJpg } from './heicToJpg'

export const converters: Converter[] = [heicToJpg, docxToMarkdown, csvToJson]

export { csvToJson, docxToMarkdown, heicToJpg }
export { ConversionError }
export type { Converter, ConversionResult } from './types'
