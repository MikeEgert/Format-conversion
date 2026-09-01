export class ConversionError extends Error {
  hint: string | undefined

  constructor(message: string, hint?: string) {
    super(message)
    this.name = 'ConversionError'
    this.hint = hint
  }
}

export interface ConversionResult {
  blob: Blob
  filename: string
  sourceSize?: number
}

export type ImageFormat = 'jpg' | 'png' | 'webp'

export interface ImageFormatOption {
  id: ImageFormat
  label: string
  lossy: boolean
}

export interface ConversionOptions {
  quality?: number
  format?: ImageFormat
  maxDimension?: number
}

export interface ConverterDetail {
  about: string
  useCases: string[]
  accepts: string[]
}

export interface Converter {
  id: string
  name: string
  fromLabel: string
  toLabel: string
  description: string
  accept: string
  outputType: string
  supportsQuality?: boolean
  supportsResize?: boolean
  formats?: ImageFormatOption[]
  detail?: ConverterDetail
  convert: (file: File, options?: ConversionOptions) => Promise<ConversionResult>
}
