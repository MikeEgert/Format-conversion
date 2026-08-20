import { useState } from 'react'
import { converters, ConversionError } from './converters'
import type { ConversionResult } from './converters'
import { usePro } from './pro/usePro'
import { mapWithConcurrency, zipResults } from './lib/batch'
import { downloadResult, formatBytes } from './converters/helpers'
import { DropZone } from './components/DropZone'
import { ResultCard } from './components/ResultCard'
import { Results } from './components/Results'
import { UpgradeModal } from './components/UpgradeModal'

type Status = 'idle' | 'working' | 'done' | 'error'

interface FailedFile {
  name: string
  message: string
  hint?: string
}

type Outcome = { ok: true; result: ConversionResult } | ({ ok: false } & FailedFile)

function App() {
  const { isPro } = usePro()
  const [converterId, setConverterId] = useState(converters[0].id)
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<ConversionResult[]>([])
  const [failed, setFailed] = useState<FailedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const converter = converters.find((c) => c.id === converterId) ?? converters[0]

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
    if (selected.length > 1 && !isPro) {
      setPendingFiles(selected)
      setShowUpgrade(true)
      return
    }
    void run(selected)
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
          const result = await converter.convert(file)
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

  async function handleDownloadAll() {
    const zip = await zipResults(results)
    downloadResult({ blob: zip, filename: 'converted-files.zip' })
  }

  function handleUnlocked() {
    setShowUpgrade(false)
    if (pendingFiles.length) void run(pendingFiles)
  }

  return (
    <div className="page">
      <header className="header">
        <span className="brand">
          <svg className="brand-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M8 13h8M8 16h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Format Converter
        </span>
        <div className="header-actions">
          <span className="badge">Private &amp; secure</span>
          {isPro ? (
            <span className="badge badge-pro">Pro</span>
          ) : (
            <button type="button" className="upgrade-link" onClick={() => setShowUpgrade(true)}>
              Upgrade
            </button>
          )}
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1>Convert files in your browser.</h1>
          <p>
            No uploads, no ads, no watermarks. Your files never leave your device — pick a format,
            drop a file, done.
          </p>
        </section>

        <section className="converters" aria-label="Choose a conversion">
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
          <ResultCard result={results[0]} onReset={reset} />
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
      </main>

      <footer className="footer">
        <p>
          {isPro ? 'Pro: batch conversion enabled.' : 'Batch conversion is a Pro feature.'}{' '}
          More formats coming soon.
        </p>
        <p className="footer-sub">Everything runs locally in your browser.</p>
      </footer>

      {showUpgrade && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} onUnlocked={handleUnlocked} />
      )}
    </div>
  )
}

export default App
