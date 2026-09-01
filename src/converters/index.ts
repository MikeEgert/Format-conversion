import { ConversionError, type Converter, type ConverterCategory } from './types'
import { csvToJson } from './csvToJson'
import { docxToMarkdown } from './docxToMarkdown'
import { epubToPdf } from './epubToPdf'
import { heicToJpg } from './heicToJpg'
import { imageConvert } from './imageConvert'
import { jsonToCsv } from './jsonToCsv'
import { pdfToDocx } from './pdfToDocx'
import { csvToXlsx, jsonToXlsx, xlsxToCsv, xlsxToJson } from './xlsx'

export const converters: Converter[] = [
  imageConvert,
  heicToJpg,
  docxToMarkdown,
  pdfToDocx,
  epubToPdf,
  csvToJson,
  jsonToCsv,
  xlsxToCsv,
  csvToXlsx,
  xlsxToJson,
  jsonToXlsx,
]

const CATEGORY_ORDER: ConverterCategory[] = ['Images', 'Documents', 'E-books', 'Data']

export function groupConvertersByCategory(
  list: Converter[],
): { category: ConverterCategory; converters: Converter[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    converters: list.filter((c) => c.category === category),
  })).filter((group) => group.converters.length > 0)
}

export { ConversionError }
export type {
  Converter,
  ConverterCategory,
  ConversionResult,
  ImageFormat,
  ImageFormatOption,
} from './types'
