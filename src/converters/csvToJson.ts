import Papa from 'papaparse'
import { replaceExtension } from './helpers'
import { ConversionError, type Converter } from './types'

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
    if (!text.trim()) {
      throw new ConversionError(
        'The CSV file appears to be empty.',
        'Check that the file has data, then try exporting it again.',
      )
    }

    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
    })

    if (parsed.data.length === 0) {
      throw new ConversionError(
        'No data rows were found in this CSV.',
        'Make sure the first row is a header and there is at least one row of data below it.',
      )
    }

    const json = JSON.stringify(parsed.data, null, 2)
    return {
      blob: new Blob([json], { type: 'application/json' }),
      filename: replaceExtension(file.name, 'json'),
    }
  },
}
