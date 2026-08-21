import { describe, expect, it } from 'vitest'
import { ConversionError } from './types'
import { jsonToCsv, tableToCsv, toCsvTable } from './jsonToCsv'

describe('toCsvTable', () => {
  it('flattens an array of objects and stringifies nested values', () => {
    const table = toCsvTable([
      { name: 'Alice', meta: { age: 30 } },
      { name: 'Bob', meta: { age: 25 } },
    ])
    expect(table.columns).toEqual(['name', 'meta'])
    expect(table.rows).toEqual([
      { name: 'Alice', meta: '{"age":30}' },
      { name: 'Bob', meta: '{"age":25}' },
    ])
  })

  it('collects the union of keys across objects', () => {
    const table = toCsvTable([{ a: 1 }, { b: 2 }])
    expect(table.columns).toEqual(['a', 'b'])
  })

  it('wraps a single object as a one-row table', () => {
    const table = toCsvTable({ name: 'Alice', score: 10 })
    expect(table.columns).toEqual(['name', 'score'])
    expect(table.rows).toEqual([{ name: 'Alice', score: 10 }])
  })

  it('passes through an array of arrays unchanged', () => {
    expect(
      toCsvTable([
        ['name', 'score'],
        ['Alice', 10],
      ]),
    ).toEqual({
      columns: null,
      rows: [
        ['name', 'score'],
        ['Alice', 10],
      ],
    })
  })

  it('throws when the array is empty', () => {
    expect(() => toCsvTable([])).toThrowError(ConversionError)
  })

  it('throws when the array mixes objects and arrays', () => {
    expect(() => toCsvTable([{ a: 1 }, [2]])).toThrowError(ConversionError)
  })

  it('throws when the top-level value is a scalar', () => {
    expect(() => toCsvTable('hello')).toThrowError(ConversionError)
    expect(() => toCsvTable(42)).toThrowError(ConversionError)
    expect(() => toCsvTable(null)).toThrowError(ConversionError)
  })
})

describe('tableToCsv', () => {
  it('writes a header row from the columns', () => {
    const csv = tableToCsv({ columns: ['name', 'score'], rows: [{ name: 'Alice', score: 10 }] })
    expect(csv).toContain('name,score')
    expect(csv).toContain('Alice,10')
  })

  it('escapes cells that look like spreadsheet formulae', () => {
    const csv = tableToCsv({ columns: ['name'], rows: [{ name: '=cmd()' }] })
    expect(csv).toContain("'=cmd()")
  })

  it('serializes raw rows without a header', () => {
    const csv = tableToCsv({ columns: null, rows: [['a', 'b']] })
    expect(csv).toBe('a,b')
  })
})

describe('jsonToCsv.convert', () => {
  it('handles a UTF-8 BOM at the start of the file', async () => {
    const file = new File(['\uFEFF{"name":"Alice"}'], 'data.json')
    const result = await jsonToCsv.convert(file)
    expect(await result.blob.text()).toContain('Alice')
  })
})
