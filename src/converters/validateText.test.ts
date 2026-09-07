import { describe, expect, it } from 'vitest'
import { describeCsvError, describeJsonError } from './validateText'

describe('describeJsonError', () => {
  it('returns null for valid JSON', () => {
    expect(describeJsonError('[{"name":"Ada"}]')).toBeNull()
    expect(describeJsonError(' {"a": 1} ')).toBeNull()
  })

  it('returns null for empty or whitespace-only input', () => {
    expect(describeJsonError('')).toBeNull()
    expect(describeJsonError('   \n ')).toBeNull()
  })

  it('strips a UTF-8 BOM before validating', () => {
    expect(describeJsonError('\uFEFF{"a": 1}')).toBeNull()
  })

  it('points at the stray closing brace', () => {
    const detail = describeJsonError('[{"name":"Ada"}}')
    expect(detail).not.toBeNull()
    expect(detail).toMatch(/line 1/)
    expect(detail).toMatch(/column/)
  })

  it('reports the correct line for a multi-line document', () => {
    const detail = describeJsonError('{"a": 1}\n}')
    expect(detail).toContain('line 2, column 1')
  })

  it('strips the native position suffix and reports line/column', () => {
    const detail = describeJsonError('{"a": 1')
    expect(detail).toMatch(/at line 1, column 8/)
    expect(detail).not.toContain('at position')
  })
})

describe('describeCsvError', () => {
  it('returns null for well-formed CSV', () => {
    expect(describeCsvError('name,score\nAlice,10\nBob,20')).toBeNull()
  })

  it('returns null for empty or whitespace-only input', () => {
    expect(describeCsvError('')).toBeNull()
    expect(describeCsvError('  \n ')).toBeNull()
  })

  it('flags a header with no data rows', () => {
    const detail = describeCsvError('name,score')
    expect(detail).toMatch(/header/)
  })

  it('flags an unbalanced quoted field', () => {
    const detail = describeCsvError('name,note\nAlice,"unclosed')
    expect(detail).not.toBeNull()
  })
})