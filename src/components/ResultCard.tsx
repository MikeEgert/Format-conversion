import { useEffect, useMemo, useState } from 'react'
import { downloadResult, formatBytes } from '../converters/helpers'
import type { ConversionResult } from '../converters/types'
import { SizeSavings } from './SizeSavings'

interface ResultCardProps {
  result: ConversionResult
  onReset: () => void
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const MAX_PREVIEW_ROWS = 100

export function ResultCard({ result, onReset }: ResultCardProps) {
  const isImage = result.blob.type.startsWith('image/')
  const isPdf = result.blob.type === 'application/pdf'
  const isSpreadsheet = result.blob.type === XLSX_MIME
  const isText = !isImage && !isPdf && !isSpreadsheet
  const [text, setText] = useState<string | null>(null)
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)
  const [sheet, setSheet] = useState<unknown[][] | null>(null)
  const [totalRows, setTotalRows] = useState<number | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)

  const imageUrl = useMemo(
    () => (isImage ? URL.createObjectURL(result.blob) : null),
    [result, isImage],
  )

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  useEffect(() => {
    if (!isImage) return
    let cancelled = false
    createImageBitmap(result.blob)
      .then((bitmap) => {
        if (!cancelled) setDims({ width: bitmap.width, height: bitmap.height })
        bitmap.close()
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [result, isImage])

  useEffect(() => {
    if (!isText) return
    let cancelled = false
    result.blob.text().then((value) => {
      if (!cancelled) setText(value.slice(0, 6000))
    })
    return () => {
      cancelled = true
    }
  }, [result, isText])

  useEffect(() => {
    if (!isSpreadsheet) return
    let cancelled = false
    void (async () => {
      try {
        const XLSX = await import('xlsx')
        const buffer = await result.blob.arrayBuffer()
        const wb = XLSX.read(buffer, { type: 'array' })
        const name = wb.SheetNames[0]
        const sheetObj = name != null ? wb.Sheets[name] : undefined
        if (!sheetObj) {
          if (!cancelled) setSheet([])
          return
        }
        const rows = XLSX.utils.sheet_to_json(sheetObj, {
          header: 1,
          raw: false,
          defval: '',
        }) as unknown[][]
        if (cancelled) return
        setTotalRows(rows.length)
        setSheet(rows.slice(0, MAX_PREVIEW_ROWS))
      } catch {
        if (!cancelled) setPreviewFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [result, isSpreadsheet])

  return (
    <div className="result">
      <div className="result-meta">
        <div className="result-file">
          <span className="result-name">{result.filename}</span>
          <span className="result-size">
            {dims ? `${dims.width} × ${dims.height} · ` : ''}
            {result.sourceSize != null ? (
              <>
                {formatBytes(result.sourceSize)} <span className="size-arrow">&rarr;</span>{' '}
                <span className="size-out">{formatBytes(result.blob.size)}</span>{' '}
                <SizeSavings sourceSize={result.sourceSize} outputSize={result.blob.size} />
              </>
            ) : (
              formatBytes(result.blob.size)
            )}
          </span>
        </div>
        <div className="result-actions">
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            Convert another
          </button>
          <button type="button" className="btn btn-primary" onClick={() => downloadResult(result)}>
            Download
          </button>
        </div>
      </div>

      {isImage ? (
        <div className="result-preview image">
          {imageUrl && <img src={imageUrl} alt={result.filename} />}
        </div>
      ) : isPdf ? (
        <div className="result-preview">
          <p className="pdf-note">PDF ready &mdash; download to view it.</p>
        </div>
      ) : isSpreadsheet ? (
        <div className="result-preview">
          {previewFailed ? (
            <p className="pdf-note">Spreadsheet ready &mdash; download to open it.</p>
          ) : sheet && sheet.length > 0 ? (
            <>
              <table className="sheet-table">
                <tbody>
                  {sheet.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) =>
                        ri === 0 ? (
                          <th key={ci} scope="col">
                            {String(cell)}
                          </th>
                        ) : (
                          <td key={ci}>{String(cell)}</td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalRows != null && totalRows > MAX_PREVIEW_ROWS && (
                <p className="pdf-note">
                  Showing the first {MAX_PREVIEW_ROWS} of {totalRows} rows &mdash; download for
                  the full file.
                </p>
              )}
            </>
          ) : sheet ? (
            <p className="pdf-note">This spreadsheet has no rows to preview.</p>
          ) : (
            <p className="pdf-note">Loading preview&hellip;</p>
          )}
        </div>
      ) : (
        <div className="result-preview">
          <pre>{text ?? 'Loading preview…'}</pre>
        </div>
      )}
    </div>
  )
}
