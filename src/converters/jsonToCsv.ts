import Papa from 'papaparse'
import { replaceExtension } from './helpers'
import { ConversionError, type Converter } from './types'

type JsonRow = Record<string, unknown>

function isObject(value: unknown): value is JsonRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function flattenRow(row: JsonRow): JsonRow {
  const out: JsonRow = {}
  for (const [key, value] of Object.entries(row)) {
    out[key] = value != null && typeof value === 'object' ? JSON.stringify(value) : value
  }
  return out
}

export function toCsvRows(data: unknown): JsonRow[] | unknown[][] {
  if (isObject(data)) {
    return [flattenRow(data)]
  }
  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new ConversionError(
        'The JSON array is empty.',
        'There are no items to convert. Make sure the file contains at least one object or row.',
      )
    }
    if (data.every(isObject)) {
      return data.map(flattenRow)
    }
    if (data.every(Array.isArray)) {
      return data
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
    const text = await file.text()
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

    const csv = Papa.unparse(toCsvRows(data) as JsonRow[])
    return {
      blob: new Blob([csv], { type: 'text/csv' }),
      filename: replaceExtension(file.name, 'csv'),
    }
  },
}
