import { downloadResult, formatBytes } from '../converters/helpers'
import type { ConversionResult } from '../converters/types'

interface ResultsProps {
  results: ConversionResult[]
  onDownloadAll: () => void
  onReset: () => void
}

export function Results({ results, onDownloadAll, onReset }: ResultsProps) {
  const isBatch = results.length > 1

  return (
    <div className="results">
      <div className="results-header">
        <span className="results-count">
          {results.length} file{isBatch ? 's' : ''} converted
        </span>
        <div className="result-actions">
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            Convert more
          </button>
          {isBatch && (
            <button type="button" className="btn btn-primary" onClick={onDownloadAll}>
              Download as ZIP
              <span className="btn-pro-tag">Pro</span>
            </button>
          )}
        </div>
      </div>

      <ul className="results-list">
        {results.map((result) => (
          <li key={result.filename} className="results-item">
            <div className="result-file">
              <span className="result-name">{result.filename}</span>
              <span className="result-size">{formatBytes(result.blob.size)}</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => downloadResult(result)}
            >
              Download
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
