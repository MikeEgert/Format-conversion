import { useEffect, useMemo, useState } from 'react'
import { downloadResult, formatBytes } from '../converters/helpers'
import type { ConversionResult } from '../converters/types'

interface ResultCardProps {
  result: ConversionResult
  sourceSize?: number
  onReset: () => void
}

export function ResultCard({ result, sourceSize, onReset }: ResultCardProps) {
  const isImage = result.blob.type.startsWith('image/')
  const isPdf = result.blob.type === 'application/pdf'
  const isText = !isImage && !isPdf
  const [text, setText] = useState<string | null>(null)
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)

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

  return (
    <div className="result">
      <div className="result-meta">
        <div className="result-file">
          <span className="result-name">{result.filename}</span>
          <span className="result-size">
            {dims ? `${dims.width} × ${dims.height} · ` : ''}
            {sourceSize != null ? (
              <>
                {formatBytes(sourceSize)} <span className="size-arrow">&rarr;</span>{' '}
                <span className="size-out">{formatBytes(result.blob.size)}</span>
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
      ) : (
        <div className="result-preview">
          <pre>{text ?? 'Loading preview…'}</pre>
        </div>
      )}
    </div>
  )
}
