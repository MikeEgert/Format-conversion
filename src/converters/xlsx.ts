import Papa from 'papaparse'
import type { WorkBook, WorkSheet } from 'xlsx'
import { dedupeHeaders } from './csvToJson'
import { isZipFile, replaceExtension, setOwn } from './helpers'
import { toCsvTable, type CsvTable } from './jsonToCsv'
import { ConversionError, type Converter } from './types'

type XlsxModule = typeof import('xlsx')

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function isOleFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) return false
  const b = new Uint8Array(buffer, 0, 8)
  return (
    b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 &&
    b[4] === 0xa1 && b[5] === 0xb1 && b[6] === 0x1a && b[7] === 0xe1
  )
}

function assertWorkbookHasSheet(wb: WorkBook): WorkSheet {
  const name = wb.SheetNames[0]
  const sheet = name != null ? wb.Sheets[name] : undefined
  if (!sheet) {
    throw new ConversionError(
      'This spreadsheet has no readable sheets.',
      'The file may be empty or corrupted. Try opening and re-saving it in Excel or Google Sheets.',
    )
  }
  return sheet
}

export function readWorkbook(buffer: ArrayBuffer, XLSX: XlsxModule): WorkBook {
  if (!isZipFile(buffer) && !isOleFile(buffer)) {
    throw new ConversionError(
      "This isn't a readable spreadsheet.",
      'Make sure the file is a real .xlsx or .xls file. Old or renamed files may not work — open it in Excel or Google Sheets and re-save it.',
    )
  }
  try {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
    assertWorkbookHasSheet(wb)
    return wb
  } catch (error) {
    if (error instanceof ConversionError) throw error
    throw new ConversionError(
      "This isn't a readable spreadsheet.",
      'Make sure the file is a real .xlsx or .xls file. Old or renamed files may not work — open it in Excel or Google Sheets and re-save it.',
    )
  }
}

export function workbookToCsv(wb: WorkBook, XLSX: XlsxModule): string {
  const sheet = assertWorkbookHasSheet(wb)
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: '',
  }) as unknown[][]
  return Papa.unparse(rows, { escapeFormulae: true })
}

export function workbookToJson(wb: WorkBook, XLSX: XlsxModule): string {
  const sheet = assertWorkbookHasSheet(wb)
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
  }) as unknown[][]

  const headerRow = rows[0] ?? []
  const fieldNames = dedupeHeaders(headerRow.map((cell) => String(cell ?? '')))
  const data = rows.slice(1).map((row) => {
    const obj: Record<string, unknown> = {}
    fieldNames.forEach((field, i) => setOwn(obj, field, row[i] ?? null))
    return obj
  })

  return JSON.stringify(data, null, 2)
}

export function csvToWorkbook(csv: string, XLSX: XlsxModule): WorkBook {
  if (!csv.trim()) {
    throw new ConversionError(
      'The CSV file appears to be empty.',
      'Check that the file has data, then try exporting it again.',
    )
  }

  const parsed = Papa.parse<string[]>(csv, { skipEmptyLines: 'greedy' })
  if (parsed.data.length === 0) {
    throw new ConversionError(
      'No data rows were found in this CSV.',
      'Make sure the first row is a header and there is at least one row of data below it.',
    )
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(parsed.data), 'Sheet1')
  return wb
}

export function tableToWorkbook(table: CsvTable, XLSX: XlsxModule): WorkBook {
  const wb = XLSX.utils.book_new()
  const sheet = table.columns
    ? XLSX.utils.json_to_sheet(table.rows as Record<string, unknown>[], {
        header: table.columns,
      })
    : XLSX.utils.aoa_to_sheet(table.rows as unknown[][])
  XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1')
  return wb
}

export function writeXlsx(wb: WorkBook, XLSX: XlsxModule): ArrayBuffer {
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

const SPREADSHEET_ACCEPT = `${XLSX_MIME},application/vnd.ms-excel,.xlsx,.xls`

export const xlsxToCsv: Converter = {
  id: 'xlsx-to-csv',
  name: 'Excel to CSV',
  category: 'Data',
  fromLabel: 'XLSX',
  toLabel: 'CSV',
  description: 'Turn an Excel spreadsheet into plain CSV data.',
  detail: {
    about:
      'Convert an Excel spreadsheet into a plain CSV file you can use anywhere. The first sheet is converted; numbers and dates come through as you see them in Excel.',
    useCases: [
      'Feed Excel data into a script, database, or BI tool',
      'Share data with tools that only accept CSV',
      'Strip formatting for a clean, portable file',
    ],
    accepts: ['XLSX', 'XLS'],
  },
  accept: SPREADSHEET_ACCEPT,
  outputType: 'text/csv',
  async convert(file) {
    const XLSX = await import('xlsx')
    const wb = readWorkbook(await file.arrayBuffer(), XLSX)
    const csv = workbookToCsv(wb, XLSX)
    return {
      blob: new Blob([csv], { type: 'text/csv' }),
      filename: replaceExtension(file.name, 'csv'),
    }
  },
}

export const csvToXlsx: Converter = {
  id: 'csv-to-xlsx',
  name: 'CSV to Excel',
  category: 'Data',
  fromLabel: 'CSV',
  toLabel: 'XLSX',
  description: 'Turn CSV data into a real Excel spreadsheet.',
  detail: {
    about:
      'Wrap your CSV data into a real .xlsx spreadsheet that opens cleanly in Excel, Google Sheets, and Numbers — no more flattened columns or mangled characters.',
    useCases: [
      'Open a CSV in Excel with a proper spreadsheet file',
      'Share data with people who expect an .xlsx attachment',
      'Clean up CSV imports that Excel would otherwise mangle',
    ],
    accepts: ['CSV'],
  },
  accept: '.csv,text/csv,text/plain',
  outputType: XLSX_MIME,
  async convert(file) {
    const XLSX = await import('xlsx')
    const csv = await file.text()
    const wb = csvToWorkbook(csv, XLSX)
    const bytes = writeXlsx(wb, XLSX)
    return {
      blob: new Blob([bytes], { type: XLSX_MIME }),
      filename: replaceExtension(file.name, 'xlsx'),
    }
  },
}

export const xlsxToJson: Converter = {
  id: 'xlsx-to-json',
  name: 'Excel to JSON',
  category: 'Data',
  fromLabel: 'XLSX',
  toLabel: 'JSON',
  description: 'Turn an Excel spreadsheet into structured JSON objects.',
  detail: {
    about:
      'Convert the first sheet of an Excel spreadsheet into an array of JSON objects. The header row becomes the field names; numbers, booleans, and dates keep their types.',
    useCases: [
      'Feed spreadsheet data into an app or API',
      'Inspect an Excel file as structured data',
      'Prepare data for a database import',
    ],
    accepts: ['XLSX', 'XLS'],
  },
  accept: SPREADSHEET_ACCEPT,
  outputType: 'application/json',
  async convert(file) {
    const XLSX = await import('xlsx')
    const wb = readWorkbook(await file.arrayBuffer(), XLSX)
    const json = workbookToJson(wb, XLSX)
    return {
      blob: new Blob([json], { type: 'application/json' }),
      filename: replaceExtension(file.name, 'json'),
    }
  },
}

export const jsonToXlsx: Converter = {
  id: 'json-to-xlsx',
  name: 'JSON to Excel',
  category: 'Data',
  fromLabel: 'JSON',
  toLabel: 'XLSX',
  description: 'Turn JSON data into a real Excel spreadsheet.',
  detail: {
    about:
      'Convert JSON into a real .xlsx spreadsheet. An array of objects becomes rows with column headers; an array of arrays is kept as-is.',
    useCases: [
      'Export API responses or JSON data to a spreadsheet',
      'Turn JSON into a file non-developers can open',
      'Inspect JSON data as a sortable, filterable table',
    ],
    accepts: ['JSON'],
  },
  accept: '.json,application/json,text/plain',
  outputType: XLSX_MIME,
  async convert(file) {
    const XLSX = await import('xlsx')
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

    const wb = tableToWorkbook(toCsvTable(data), XLSX)
    const bytes = writeXlsx(wb, XLSX)
    return {
      blob: new Blob([bytes], { type: XLSX_MIME }),
      filename: replaceExtension(file.name, 'xlsx'),
    }
  },
}
