import Papa from 'papaparse'
import { replaceExtension, setOwn } from './helpers'
import { ConversionError, type Converter } from './types'

type JsonRow = Record<string, unknown>

function isObject(value: unknown): value is JsonRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function flattenRow(row: JsonRow): JsonRow {
  const out: JsonRow = {}
  for (const [key, value] of Object.entries(row)) {
    const flat = value != null && typeof value === 'object' ? JSON.stringify(value) : value
    setOwn(out, key, flat)
  }
  return out
}

export interface CsvTable {
  columns: string[] | null
  rows: JsonRow[] | unknown[][]
}

export function toCsvTable(data: unknown): CsvTable {
  if (isObject(data)) {
    const row = flattenRow(data)
    return { columns: Object.keys(row), rows: [row] }
  }
  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new ConversionError(
        'The JSON array is empty.',
        'There are no items to convert. Make sure the file contains at least one object or row.',
      )
    }
    if (data.every(isObject)) {
      const rows = data.map(flattenRow)
      const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
      return { columns, rows }
    }
    if (data.every(Array.isArray)) {
      return { columns: null, rows: data }
    }
    throw new ConversionError(
      "This JSON structure can't be turned into a spreadsheet.",
      'Use an array of objects (e.g. [{"name":"A"}]) or an array of arrays (e.g. [["name"],["A"]]).',
    )
  }
  throw new ConversionError(
    "This JSON isn't a list of rows.",
    'CSV needs rows and columns. Use an array of objects or an array of arrays as the top-level value.',
  )
}

export function tableToCsv(table: CsvTable): string {
  if (table.columns) {
    return Papa.unparse(table.rows as JsonRow[], {
      columns: table.columns,
      escapeFormulae: true,
    })
  }
  return Papa.unparse(table.rows as unknown[][], { escapeFormulae: true })
}

export const jsonToCsv: Converter = {
  id: 'json-to-csv',
  name: 'JSON to CSV',
  fromLabel: 'JSON',
  toLabel: 'CSV',
  description: 'Turn JSON data into a spreadsheet-ready CSV file.',
  detail: {
    about:
      'Convert JSON data into a CSV you can open in Excel, Google Sheets, or any spreadsheet app. Works with an array of objects or an array of rows.',
    useCases: [
      'Open API responses in Excel or Google Sheets',
      'Export structured JSON for reporting or analysis',
      'Share data with people who prefer spreadsheets',
    ],
    accepts: ['JSON'],
  },
  accept: '.json,application/json,text/plain',
  outputType: 'text/csv',
  async convert(file) {
    const text = (await file.text()).replace(/^\uFEFF/, '')
    if (!text.trim()) {
      throw new ConversionError(
        'The JSON file appears to be empty.',
        'Check that the file has data, then try exporting it again.',
      )
    }

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      throw new ConversionError(
        "This isn't valid JSON.",
        'Make sure the file contains well-formed JSON. You can validate it at a JSON linter or re-export it from the source app.',
      )
    }

    const csv = tableToCsv(toCsvTable(data))
    return {
      blob: new Blob([csv], { type: 'text/csv' }),
      filename: replaceExtension(file.name, 'csv'),
    }
  },
}
