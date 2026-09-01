import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { ConversionError } from './types'
import {
  csvToWorkbook,
  jsonToXlsx,
  readWorkbook,
  tableToWorkbook,
  workbookToCsv,
  workbookToJson,
  writeXlsx,
  xlsxToCsv,
  xlsxToJson,
} from './xlsx'
import { toCsvTable } from './jsonToCsv'

function workbook(rows: unknown[][]) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Sheet1')
  return wb
}

function xlsxFile(bytes: ArrayBuffer, name = 'book.xlsx') {
  return new File([bytes], name)
}

describe('workbookToCsv', () => {
  it('writes rows to CSV using the header row', () => {
    const csv = workbookToCsv(workbook([['name', 'score'], ['Alice', 10], ['Bob', 20]]), XLSX)
    expect(csv).toContain('name,score')
    expect(csv).toContain('Alice')
    expect(csv).toContain('Bob')
  })

  it('escapes spreadsheet formula cells', () => {
    const csv = workbookToCsv(workbook([['name'], ['=SUM(A1:A2)']]), XLSX)
    expect(csv).toContain("'=SUM(A1:A2)")
  })
})

describe('workbookToJson', () => {
  it('builds typed JSON objects from the header row', () => {
    const json = JSON.parse(workbookToJson(workbook([['name', 'score'], ['Alice', 10], ['Bob', 20]]), XLSX))
    expect(json).toEqual([
      { name: 'Alice', score: 10 },
      { name: 'Bob', score: 20 },
    ])
  })

  it('keeps a __proto__ header as an own property without polluting Object.prototype', () => {
    const json = JSON.parse(workbookToJson(workbook([['__proto__', 'name'], ['a', 'b']]), XLSX))
    expect(json).toHaveLength(1)
    expect(Object.prototype.hasOwnProperty.call(json[0], '__proto__')).toBe(true)
    expect('a' in {}).toBe(false)
    expect((Object.prototype as Record<string, unknown>).name).toBeUndefined()
  })

  it('renames duplicate headers with a numeric suffix', () => {
    const json = JSON.parse(workbookToJson(workbook([['a', 'a'], [1, 2]]), XLSX))
    expect(json).toEqual([{ a: 1, a_1: 2 }])
  })
})

describe('csvToWorkbook / writeXlsx', () => {
  it('wraps CSV data into a readable xlsx', () => {
    const wb = csvToWorkbook('name,score\nAlice,10\nBob,20', XLSX)
    const bytes = writeXlsx(wb, XLSX)
    const round = XLSX.read(bytes, { type: 'array' })
    expect(workbookToCsv(round, XLSX)).toContain('Alice')
  })

  it('rejects empty CSV', () => {
    expect(() => csvToWorkbook('', XLSX)).toThrowError(ConversionError)
    expect(() => csvToWorkbook('  \n ', XLSX)).toThrowError(ConversionError)
  })
})

describe('tableToWorkbook / writeXlsx', () => {
  it('converts an array of objects into a readable xlsx', () => {
    const table = toCsvTable([{ name: 'Alice', score: 10 }, { name: 'Bob', score: 20 }])
    const bytes = writeXlsx(tableToWorkbook(table, XLSX), XLSX)
    const round = XLSX.read(bytes, { type: 'array' })
    expect(JSON.parse(workbookToJson(round, XLSX))).toEqual([
      { name: 'Alice', score: 10 },
      { name: 'Bob', score: 20 },
    ])
  })

  it('keeps an array of arrays as-is', () => {
    const table = toCsvTable([['name', 'score'], ['Alice', 10]])
    const bytes = writeXlsx(tableToWorkbook(table, XLSX), XLSX)
    const round = XLSX.read(bytes, { type: 'array' })
    expect(workbookToCsv(round, XLSX)).toContain('name,score')
  })
})

describe('readWorkbook', () => {
  it('rejects a file that is not a spreadsheet', () => {
    expect(() => readWorkbook(new TextEncoder().encode('not a spreadsheet').buffer, XLSX)).toThrowError(
      ConversionError,
    )
  })
})

describe('convert', () => {
  it('xlsxToCsv converts a real .xlsx file', async () => {
    const bytes = writeXlsx(workbook([['name'], ['Alice']]), XLSX)
    const result = await xlsxToCsv.convert(xlsxFile(bytes))
    expect(result.filename).toBe('book.csv')
    expect(result.blob.type).toBe('text/csv')
    expect(await result.blob.text()).toContain('Alice')
  })

  it('xlsxToJson converts a real .xlsx file', async () => {
    const bytes = writeXlsx(workbook([['name', 'score'], ['Alice', 10]]), XLSX)
    const result = await xlsxToJson.convert(xlsxFile(bytes))
    expect(result.filename).toBe('book.json')
    expect(JSON.parse(await result.blob.text())).toEqual([{ name: 'Alice', score: 10 }])
  })

  it('jsonToXlsx converts JSON into a real .xlsx file', async () => {
    const file = new File([JSON.stringify([{ name: 'Alice' }])], 'data.json')
    const result = await jsonToXlsx.convert(file)
    expect(result.filename).toBe('data.xlsx')
    const round = XLSX.read(await result.blob.arrayBuffer(), { type: 'array' })
    expect(workbookToCsv(round, XLSX)).toContain('Alice')
  })
})
