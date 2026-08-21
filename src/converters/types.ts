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
}

export interface ConversionOptions {
  quality?: number
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
  convert: (file: File, options?: ConversionOptions) => Promise<ConversionResult>
}
