import Papa from 'papaparse'
import { replaceExtension } from './helpers'
import { ConversionError, type Converter } from './types'

const FLOAT = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/
const ISO_DATE =
  /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/
const MAX_SAFE_FLOAT = 2 ** 53

function hasLeadingZero(value: string): boolean {
  const integer = value.replace(/^\s*[+-]/, '').split(/[.eE]/)[0]
  return integer.length > 1 && integer.startsWith('0')
}

export function typeCsvValue(value: string): unknown {
  if (value === 'true' || value === 'TRUE') return true
  if (value === 'false' || value === 'FALSE') return false
  if (FLOAT.test(value) && !hasLeadingZero(value)) {
    const n = parseFloat(value)
    if (n > -MAX_SAFE_FLOAT && n < MAX_SAFE_FLOAT) return n
  }
  if (ISO_DATE.test(value)) return new Date(value)
  return value === '' ? null : value
}

export function parseCsv(text: string): Record<string, unknown>[] {
  if (!text.trim()) {
    throw new ConversionError(
      'The CSV file appears to be empty.',
      'Check that the file has data, then try exporting it again.',
    )
  }

  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transform: typeCsvValue,
  })

  if (parsed.data.length === 0) {
    throw new ConversionError(
      'No data rows were found in this CSV.',
      'Make sure the first row is a header and there is at least one row of data below it.',
    )
  }

  return parsed.data
}

export const csvToJson: Converter = {
  id: 'csv-to-json',
  name: 'CSV to JSON',
  fromLabel: 'CSV',
  toLabel: 'JSON',
  description: 'Turn spreadsheet rows into clean, nested JSON objects.',
  detail: {
    about:
      'Convert spreadsheet rows into clean, nested JSON objects — ready for developers, apps, and APIs. The first row becomes the field names.',
    useCases: [
      'Feed spreadsheet data into a script or API',
      'Inspect data as structured JSON',
      'Prepare data for a database import',
    ],
    accepts: ['CSV'],
  },
  accept: '.csv,text/csv,text/plain',
  outputType: 'application/json',
  async convert(file) {
    const text = await file.text()
    const data = parseCsv(text)
    const json = JSON.stringify(data, null, 2)
    return {
      blob: new Blob([json], { type: 'application/json' }),
      filename: replaceExtension(file.name, 'json'),
    }
  },
}
