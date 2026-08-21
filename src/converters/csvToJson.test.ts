import { describe, expect, it } from 'vitest'
import { ConversionError } from './types'
import { parseCsv } from './csvToJson'

describe('parseCsv', () => {
  it('parses rows into objects using the header row', () => {
    const rows = parseCsv('name,score\nAlice,10\nBob,20')
    expect(rows).toEqual([
      { name: 'Alice', score: 10 },
      { name: 'Bob', score: 20 },
    ])
  })

  it('keeps non-numeric values as strings', () => {
    const rows = parseCsv('name,note\nAlice,hello')
    expect(rows).toEqual([{ name: 'Alice', note: 'hello' }])
  })

  it('skips empty lines', () => {
    const rows = parseCsv('name\nAlice\n\n')
    expect(rows).toEqual([{ name: 'Alice' }])
  })

  it('throws when the input is empty', () => {
    expect(() => parseCsv('')).toThrowError(ConversionError)
    expect(() => parseCsv('   \n  ')).toThrowError(ConversionError)
  })

  it('throws when there is a header but no data rows', () => {
    expect(() => parseCsv('name,score\n')).toThrowError(ConversionError)
  })
})
