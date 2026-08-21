import { describe, expect, it } from 'vitest'
import { ConversionError } from './types'
import { toCsvRows } from './jsonToCsv'

describe('toCsvRows', () => {
  it('flattens an array of objects and stringifies nested values', () => {
    const rows = toCsvRows([
      { name: 'Alice', meta: { age: 30 } },
      { name: 'Bob', meta: { age: 25 } },
    ])
    expect(rows).toEqual([
      { name: 'Alice', meta: '{"age":30}' },
      { name: 'Bob', meta: '{"age":25}' },
    ])
  })

  it('wraps a single object as a one-row table', () => {
    expect(toCsvRows({ name: 'Alice', score: 10 })).toEqual([{ name: 'Alice', score: 10 }])
  })

  it('passes through an array of arrays unchanged', () => {
    expect(
      toCsvRows([
        ['name', 'score'],
        ['Alice', 10],
      ]),
    ).toEqual([
      ['name', 'score'],
      ['Alice', 10],
    ])
  })

  it('throws when the array is empty', () => {
    expect(() => toCsvRows([])).toThrowError(ConversionError)
  })

  it('throws when the array mixes objects and arrays', () => {
    expect(() => toCsvRows([{ a: 1 }, [2]])).toThrowError(ConversionError)
  })

  it('throws when the top-level value is a scalar', () => {
    expect(() => toCsvRows('hello')).toThrowError(ConversionError)
    expect(() => toCsvRows(42)).toThrowError(ConversionError)
    expect(() => toCsvRows(null)).toThrowError(ConversionError)
  })
})
