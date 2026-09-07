import Papa from 'papaparse'

export function describeJsonError(text: string): string | null {
  const input = text.replace(/^\uFEFF/, '')
  if (!input.trim()) return null
  let error: unknown
  try {
    JSON.parse(input)
    return null
  } catch (err) {
    error = err
  }
  if (!(error instanceof SyntaxError)) return null
  const message = error.message
  const position = message.match(/at position (\d+)/)
  if (position) {
    const pos = Number(position[1])
    const before = input.slice(0, pos)
    const line = before.split('\n').length
    const column = pos - before.lastIndexOf('\n')
    const detail = message.replace(
      /,? ?in JSON at position \d+(?: \(line \d+ column \d+\))?/,
      '',
    )
    return `${detail} at line ${line}, column ${column}`
  }
  return message
}

export function describeCsvError(text: string): string | null {
  if (!text.trim()) return null
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' })
  const error = parsed.errors[0]
  if (error) {
    const row = typeof error.row === 'number' ? ` at row ${error.row + 1}` : ''
    return `${error.message}${row}`
  }
  const rows = parsed.data
  const headerRow = rows[0] ?? []
  if (headerRow.length === 0) return 'No data found — the first row should be a header.'
  if (rows.length === 1) return 'Only a header row was found — add at least one row of data.'
  return null
}