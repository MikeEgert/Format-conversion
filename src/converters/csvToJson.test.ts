import { describe, expect, it } from 'vitest'
import { ConversionError } from './types'
import { parseCsv, typeCsvValue } from './csvToJson'

describe('typeCsvValue', () => {
  it('converts plain numbers to numbers', () => {
    expect(typeCsvValue('1234')).toBe(1234)
    expect(typeCsvValue('10.5')).toBe(10.5)
    expect(typeCsvValue('0')).toBe(0)
    expect(typeCsvValue('0.5')).toBe(0.5)
  })

  it('keeps leading zeros as strings', () => {
    expect(typeCsvValue('01234')).toBe('01234')
    expect(typeCsvValue('00.5')).toBe('00.5')
    expect(typeCsvValue('-0123')).toBe('-0123')
  })

  it('keeps integers beyond the safe range as strings', () => {
    expect(typeCsvValue('12345678901234567890')).toBe('12345678901234567890')
  })

  it('converts booleans and dates', () => {
    expect(typeCsvValue('true')).toBe(true)
    expect(typeCsvValue('false')).toBe(false)
    expect(typeCsvValue('2020-01-01T00:00:00Z')).toBeInstanceOf(Date)
  })

  it('keeps ordinary strings and empty values', () => {
    expect(typeCsvValue('hello')).toBe('hello')
    expect(typeCsvValue('')).toBeNull()
  })
})

describe('parseCsv', () => {
  it('parses rows into objects using the header row', () => {
    const rows = parseCsv('name,score\nAlice,10\nBob,20')
    expect(rows).toEqual([
      { name: 'Alice', score: 10 },
      { name: 'Bob', score: 20 },
    ])
  })

  it('preserves leading zeros in IDs', () => {
    const rows = parseCsv('id,name\n01234,Alice')
    expect(rows).toEqual([{ id: '01234', name: 'Alice' }])
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

  it('preserves a __proto__ header without polluting Object.prototype', () => {
    const rows = parseCsv('__proto__,constructor,name\na,b,c')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveProperty('__proto__', 'a')
    expect(rows[0]).toHaveProperty('constructor', 'b')
    expect(rows[0]).toHaveProperty('name', 'c')
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'a')).toBe(false)
    expect('a' in {}).toBe(false)
  })

  it('keeps a constructor header as ordinary data', () => {
    const rows = parseCsv('constructor,name\nx,y')
    expect(rows[0]).toEqual({ constructor: 'x', name: 'y' })
  })

  it('renames duplicate headers with a numeric suffix', () => {
    const rows = parseCsv('a,a,b\n1,2,3')
    expect(rows).toEqual([{ a: 1, a_1: 2, b: 3 }])
  })

  it('strips a UTF-8 BOM from the first header', () => {
    const rows = parseCsv('\uFEFFname,score\nAlice,10')
    expect(rows).toEqual([{ name: 'Alice', score: 10 }])
  })

  it('keeps spreadsheet formula strings as plain strings', () => {
    const rows = parseCsv('name\n=cmd()\n@sum\n+1\n-2+2')
    expect(rows).toEqual([
      { name: '=cmd()' },
      { name: '@sum' },
      { name: '+1' },
      { name: '-2+2' },
    ])
  })

  it('handles quoted fields with commas and newlines', () => {
    const rows = parseCsv('name,note\n"Alice, A.","line1\nline2"')
    expect(rows).toEqual([{ name: 'Alice, A.', note: 'line1\nline2' }])
  })

  it('handles CRLF line endings', () => {
    const rows = parseCsv('a,b\r\n1,2\r\n3,4')
    expect(rows).toEqual([{ a: 1, b: 2 }, { a: 3, b: 4 }])
  })
})
