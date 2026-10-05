import { ConversionError } from '../converters/types'

export function describeConversionFailure(error: unknown): { message: string; hint?: string } {
  if (error instanceof ConversionError) {
    return { message: error.message, hint: error.hint }
  }

  return {
    message: 'Could not convert this file.',
    hint: 'Try again. If the problem continues, try a smaller file or another browser.',
  }
}
