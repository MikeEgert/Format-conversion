import { describe, expect, it } from 'vitest'
import { ConversionError } from '../converters/types'
import { describeConversionFailure } from './conversionFailure'

describe('describeConversionFailure', () => {
  it('keeps actionable converter messages and hints', () => {
    expect(describeConversionFailure(new ConversionError('This PDF is password-protected.', 'Remove the password and try again.'))).toEqual({
      message: 'This PDF is password-protected.',
      hint: 'Remove the password and try again.',
    })
  })

  it('does not show unexpected technical errors to visitors', () => {
    const failure = describeConversionFailure(new TypeError('Cannot read properties of undefined'))
    expect(failure.message).toBe('Could not convert this file.')
    expect(failure.hint).toContain('Try again')
    expect(failure.message).not.toContain('undefined')
  })
})
