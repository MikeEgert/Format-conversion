import { useEffect, useMemo, useState } from 'react'
import { downloadResult, formatBytes } from '../converters/helpers'
import type { ConversionResult } from '../converters/types'

interface ResultCardProps {
  result: ConversionResult
  onReset: () => void
}

export function ResultCard({ result, onReset }: ResultCardProps) {
  const isImage = result.blob.type.startsWith('image/')
  const [text, setText] = useState<string | null>(null)

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
    if (isImage) return
    let cancelled = false
    result.blob.text().then((value) => {
      if (!cancelled) setText(value.slice(0, 6000))
    })
    return () => {
      cancelled = true
    }
  }, [result, isImage])

  return (
    <div className="result">
      <div className="result-meta">
        <div className="result-file">
          <span className="result-name">{result.filename}</span>
          <span className="result-size">{formatBytes(result.blob.size)}</span>
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

      <div className={isImage ? 'result-preview image' : 'result-preview'}>
        {isImage && imageUrl ? (
          <img src={imageUrl} alt={result.filename} />
        ) : (
          <pre>{text ?? 'Loading preview…'}</pre>
        )}
      </div>
    </div>
  )
}
