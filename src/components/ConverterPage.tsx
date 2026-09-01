import { useEffect, useState } from 'react'
import { converters, ConversionError } from '../converters'
import type { ConversionResult, ImageFormat } from '../converters'
import { mapWithConcurrency, zipResults } from '../lib/batch'
import { assertFileSize, downloadResult, formatBytes } from '../converters/helpers'
import { DropZone } from './DropZone'
import { FormatPicker } from './FormatPicker'
import { QualityPicker } from './QualityPicker'
import { ResizePicker } from './ResizePicker'
import { ResultCard } from './ResultCard'
import { Results } from './Results'
import { UpgradeModal } from './UpgradeModal'
import { usePro } from '../pro/usePro'
import { isLocalhost } from '../lib/isLocalhost'

type Status = 'idle' | 'working' | 'done' | 'error'

interface FailedFile {
  name: string
  message: string
  hint?: string
}

type Outcome = { ok: true; result: ConversionResult } | ({ ok: false } & FailedFile)

function getInitialConverterId(): string {
  const match = window.location.hash.match(/[?&]converter=([^&]+)/)
  if (match && converters.some((c) => c.id === match[1])) {
    return match[1]
  }
  return converters[0].id
}

export function ConverterPage() {
  const { isPro } = usePro()
  const [converterId, setConverterId] = useState(getInitialConverterId)
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<ConversionResult[]>([])
  const [failed, setFailed] = useState<FailedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [quality, setQuality] = useState(0.9)
  const [format, setFormat] = useState<ImageFormat>('jpg')
  const [maxDimension, setMaxDimension] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const converter = converters.find((c) => c.id === converterId) ?? converters[0]
  const formatOption = converter.formats?.find((f) => f.id === format)
  const showQuality =
    converter.supportsQuality && (!converter.formats || !formatOption || formatOption.lossy)
  const isImageEditor = Boolean(converter.formats || converter.supportsResize)

  function reset() {
    setFiles([])
    setResults([])
    setFailed([])
    setError(null)
    setErrorHint(null)
    setStatus('idle')
    setProgress(null)
  }

  function selectConverter(id: string) {
    if (id === converterId) return
    setConverterId(id)
    reset()
  }

  function handleFiles(selected: File[]) {
    if (selected.length === 0) return
    if (isLocalhost() && selected.length > 1 && !isPro) {
      setPendingFiles(selected)
      setShowUpgrade(true)
      return
    }
    void run(selected)
  }

  function handleUnlocked() {
    setShowUpgrade(false)
    if (pendingFiles.length) void run(pendingFiles)
  }

  async function run(selected: File[]) {
    setFiles(selected)
    setResults([])
    setFailed([])
    setError(null)
    setErrorHint(null)
    setStatus('working')
    setProgress({ done: 0, total: selected.length })

    const outcomes = await mapWithConcurrency<File, Outcome>(
      selected,
      1,
      async (file) => {
        try {
          assertFileSize(file)
          const result = await converter.convert(file, { quality, format, maxDimension })
          result.sourceSize = file.size
          return { ok: true, result }
        } catch (err) {
          return {
            ok: false,
            name: file.name,
            message:
              err instanceof Error && err.message
                ? err.message
                : 'Could not convert this file.',
            hint: err instanceof ConversionError ? err.hint : undefined,
          }
        }
      },
      (done, total) => setProgress({ done, total }),
    )

    const converted = outcomes.filter((o): o is Extract<Outcome, { ok: true }> => o.ok)
    const failures = outcomes.filter((o): o is Extract<Outcome, { ok: false }> => !o.ok)

    if (converted.length === 0) {
      setStatus('error')
      setError(failures[0]?.message ?? 'Something went wrong while converting.')
      setErrorHint(failures[0]?.hint ?? null)
      return
    }

    setResults(converted.map((o) => o.result))
    setFailed(failures)
    setStatus('done')
  }

  useEffect(() => {
    if (!isImageEditor) return
    if (status !== 'done' || results.length !== 1 || files.length !== 1) return
    void run(files)
    // Re-convert the single image whenever the options change. status/files/results are
    // intentionally read via closure to avoid re-running when the conversion itself completes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, quality, maxDimension])

  async function handleDownloadAll() {
    const zip = await zipResults(results)
    downloadResult({ blob: zip, filename: 'converted-files.zip' })
  }

  return (
    <main className="main">
      <section className="converters converters-select" aria-label="Choose a conversion">
        {converters.map((c) => (
          <button
            key={c.id}
            type="button"
            className={c.id === converterId ? 'converter-card active' : 'converter-card'}
            onClick={() => selectConverter(c.id)}
          >
            <span className="converter-badges">
              <span className="from">{c.fromLabel}</span>
              <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="to">{c.toLabel}</span>
            </span>
            <span className="converter-name">{c.name}</span>
            <span className="converter-desc">{c.description}</span>
          </button>
        ))}
      </section>

      <section id="tool">
        {status === 'working' ? (
          <div className="working">
            <span className="spinner" aria-hidden="true" />
            <div className="working-text">
              <p>
                Converting {progress ? `${progress.done + 1} of ${progress.total}` : ''}…
              </p>
              <div className="progress">
                <div
                  className="progress-bar"
                  style={{ width: progress ? `${(progress.done / progress.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        ) : status === 'done' && results.length === 1 ? (
          <>
            {isImageEditor && (
              <>
                {converter.formats && (
                  <FormatPicker formats={converter.formats} value={format} onChange={setFormat} />
                )}
                {converter.supportsResize && (
                  <ResizePicker value={maxDimension} onChange={setMaxDimension} />
                )}
                {showQuality && (
                  <QualityPicker value={quality} onChange={setQuality} />
                )}
              </>
            )}
            <ResultCard result={results[0]} onReset={reset} />
          </>
        ) : status === 'done' ? (
          <Results results={results} onDownloadAll={handleDownloadAll} onReset={reset} />
        ) : status === 'error' ? (
          <div className="error">
            <p>
              {files.length > 1 ? 'Conversion failed.' : (
                <>
                  Couldn&apos;t convert <strong>{files[0]?.name}</strong>.
                </>
              )}
            </p>
            <p className="error-detail">{error}</p>
            {errorHint && <p className="error-hint">{errorHint}</p>}
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Try again
            </button>
          </div>
        ) : (
          <DropZone accept={converter.accept} onFiles={handleFiles} />
        )}

        {status === 'done' && failed.length > 0 && (
          <div className="failures">
            <p className="failures-title">
              {failed.length} file{failed.length > 1 ? 's' : ''} couldn&apos;t be converted:
            </p>
            <ul className="failures-list">
              {failed.map((f) => (
                <li key={f.name} className="failures-item">
                  <strong className="failures-name">{f.name}</strong>
                  <span className="failures-reason">{f.message}</span>
                  {f.hint && <span className="failures-hint">{f.hint}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status === 'done' && results.length > 0 && (
          <p className="note">
            Converted {formatBytes(results.reduce((sum, r) => sum + r.blob.size, 0))} — saved only
            in your browser.
          </p>
        )}
      </section>

      {showUpgrade && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} onUnlocked={handleUnlocked} />
      )}
    </main>
  )
}
