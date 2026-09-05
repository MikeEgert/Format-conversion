import { converters } from './index'
import type { ConversionOptions, ConversionResult, ImageFormatOption } from './types'

export { setFontBaseUrl } from './fontConfig'

export interface ConverterInfo {
  id: string
  accept: string
  outputType: string
  supportsQuality?: boolean
  supportsResize?: boolean
  formats?: ImageFormatOption[]
}

export function listConverters(): ConverterInfo[] {
  return converters.map(({ id, accept, outputType, supportsQuality, supportsResize, formats }) => ({
    id,
    accept,
    outputType,
    supportsQuality,
    supportsResize,
    formats,
  }))
}

export function convert(
  id: string,
  file: File,
  options?: ConversionOptions,
): Promise<ConversionResult> {
  const converter = converters.find((c) => c.id === id)
  if (!converter) {
    return Promise.reject(new Error(`Unknown converter: ${id}`))
  }
  return converter.convert(file, options)
}
