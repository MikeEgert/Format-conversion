import { useEffect, useState } from 'react'
import { ConversionError } from '../converters'
import { downloadResult, formatBytes, replaceExtension, assertFileSize } from '../converters/helpers'
import { DropZone } from './DropZone'
import { extractPdfPages, getPdfPageCount, mergePdfs, organizePdf, parsePageRanges, type PdfPageOperation } from '../pdf/pdfTools'

type Mode = 'merge' | 'extract' | 'organize'
type Status = 'idle' | 'working' | 'done' | 'error'

const pdfModes = [
  { id: 'merge', name: 'Merge PDFs', description: 'Combine PDF files' },
  { id: 'extract', name: 'Extract pages', description: 'Keep selected pages' },
  { id: 'organize', name: 'Organize pages', description: 'Reorder, rotate, remove' },
] as const

interface SelectedPage {
  sourceIndex: number
  rotation: 0 | 90 | 180 | 270
}

function errorMessage(error: unknown): { message: string; hint?: string } {
  return {
    message: error instanceof Error ? error.message : 'Could not process this PDF.',
    hint: error instanceof ConversionError ? error.hint : undefined,
  }
}

function pdfBlob(bytes: Uint8Array): Blob {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  return new Blob([buffer], { type: 'application/pdf' })
}

export function PdfToolsPage() {
  const [mode, setMode] = useState<Mode>('merge')
  const [files, setFiles] = useState<File[]>([])
  const [pageCount, setPageCount] = useState(0)
  const [pages, setPages] = useState<SelectedPage[]>([])
  const [ranges, setRanges] = useState('1')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null)
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null)

  useEffect(() => {
    if (files.length !== 1 || mode === 'merge') return
    let cancelled = false
    void files[0].arrayBuffer().then(getPdfPageCount).then((count) => {
      if (cancelled) return
      setPageCount(count)
      setRanges('1')
      setPages(Array.from({ length: count }, (_, sourceIndex) => ({ sourceIndex, rotation: 0 })))
    }).catch((caught) => {
      if (!cancelled) setError(errorMessage(caught))
    })
    return () => { cancelled = true }
  }, [files, mode])

  function reset() {
    setFiles([])
    setPageCount(0)
    setPages([])
    setRanges('1')
    setStatus('idle')
    setError(null)
    setResult(null)
  }

  function chooseMode(next: Mode) {
    setMode(next)
    reset()
  }

  function handleFiles(selected: File[]) {
    setError(null)
    setResult(null)
    setStatus('idle')
    setFiles(mode === 'merge' ? selected : selected.slice(0, 1))
  }

  function updatePage(index: number, update: Partial<SelectedPage>) {
    setPages((current) => current.map((page, i) => (i === index ? { ...page, ...update } : page)))
  }

  function movePage(index: number, direction: -1 | 1) {
    setPages((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function run() {
    setStatus('working')
    setError(null)
    try {
      for (const file of files) assertFileSize(file)
      let blob: Blob
      let filename: string
      if (mode === 'merge') {
        blob = pdfBlob(await mergePdfs(await Promise.all(files.map((file) => file.arrayBuffer()))))
        filename = 'merged.pdf'
      } else if (mode === 'extract') {
        const selected = parsePageRanges(ranges, pageCount)
        if (selected.length === 0) throw new ConversionError('Enter valid page numbers or ranges.', `Use a format like 1, 3-5 (this PDF has ${pageCount} pages).`)
        blob = pdfBlob(await extractPdfPages(await files[0].arrayBuffer(), selected))
        filename = replaceExtension(files[0].name, 'extracted.pdf')
      } else {
        const operations: PdfPageOperation[] = pages.map(({ sourceIndex, rotation }) => ({ sourceIndex, rotation }))
        blob = pdfBlob(await organizePdf(await files[0].arrayBuffer(), operations))
        filename = replaceExtension(files[0].name, 'organized.pdf')
      }
      setResult({ blob, filename })
      setStatus('done')
    } catch (caught) {
      setError(errorMessage(caught))
      setStatus('error')
    }
  }

  const canRun = mode === 'merge' ? files.length >= 2 : files.length === 1
  const activeMode = pdfModes.find((item) => item.id === mode) ?? pdfModes[0]
  return (
    <main className="main converter-page pdf-tools-page">
      <div className="converter-workspace pdf-tools-workspace">
        <aside className="converter-types" aria-labelledby="pdf-tools-types-title">
          <span className="tool-panel-eyebrow">PDF tools</span>
          <h2 id="pdf-tools-types-title">Choose a tool</h2>
          <select
            className="converter-type-select"
            aria-label="Choose a PDF tool"
            value={mode}
            onChange={(event) => chooseMode(event.target.value as Mode)}
          >
            {pdfModes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <div className="converter-type-groups">
            <div className="converter-type-group">
              {pdfModes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={mode === item.id ? 'converter-type-button active' : 'converter-type-button'}
                  onClick={() => chooseMode(item.id)}
                  aria-pressed={mode === item.id}
                >
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <aside className="converter-settings" aria-labelledby="pdf-tools-settings-title">
          <span className="tool-panel-eyebrow">Output settings</span>
          <h2 id="pdf-tools-settings-title">Adjust output</h2>
          {mode === 'extract' ? (
            <label className="pdf-tools-field">
              <span>Pages to extract</span>
              <input value={ranges} onChange={(event) => setRanges(event.target.value)} placeholder="1, 3-5" />
              <small>{pageCount > 0 ? `${pageCount} pages available. ` : ''}Use commas and ranges.</small>
            </label>
          ) : (
            <div className="setting-static">
              <span>Save as</span>
              <strong>{mode === 'merge' ? 'One PDF' : 'Organized PDF'}</strong>
            </div>
          )}
          <p className="tool-panel-note">Your files stay on your device.</p>
          <a className="converter-pdf-link" href="#/tool">Back to converters →</a>
        </aside>

        <section className="converter-stage pdf-tools-stage" aria-label={activeMode.name}>
          {files.length === 0 ? (
            <DropZone accept=".pdf,application/pdf" onFiles={handleFiles} />
          ) : (
            <div className="pdf-tools-selection">
              <div className="pdf-tools-files">
                {files.map((file, index) => (
                  <div className="pdf-tools-file" key={`${file.name}-${file.size}-${index}`}>
                    <strong>{file.name}</strong>
                    <span>{formatBytes(file.size)}</span>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-ghost btn-small" onClick={reset}>Choose different files</button>
            </div>
          )}

          {mode === 'organize' && files.length === 1 && (
            <div className="pdf-pages" aria-label="PDF pages">
              {pages.map((page, index) => (
                <div className="pdf-page-row" key={page.sourceIndex}>
                  <div className="pdf-page-info">
                    <strong>Page {page.sourceIndex + 1}</strong>
                    <span>Output position {index + 1} · {page.rotation}°</span>
                  </div>
                  <div className="pdf-page-actions">
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => movePage(index, -1)} disabled={index === 0}>Up</button>
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => movePage(index, 1)} disabled={index === pages.length - 1}>Down</button>
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => updatePage(index, { rotation: ((page.rotation + 90) % 360) as SelectedPage['rotation'] })}>Rotate</button>
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => setPages((current) => current.filter((_, i) => i !== index))}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error pdf-tools-error"><p>{error.message}</p>{error.hint && <p className="error-hint">{error.hint}</p>}</div>}
          {status === 'working' && <div className="working pdf-tools-working"><span className="spinner" aria-hidden="true" /><p>Processing locally…</p></div>}
          {result && status === 'done' && (
            <div className="result pdf-tools-result">
              <div className="result-meta">
                <div className="result-file">
                  <span className="result-name">{result.filename}</span>
                  <span className="result-size">{formatBytes(result.blob.size)}</span>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => downloadResult(result)}>Download PDF</button>
              </div>
            </div>
          )}
          {files.length > 0 && (
            <div className="pdf-tools-actions">
              <button type="button" className="btn btn-primary" disabled={!canRun || status === 'working'} onClick={() => void run()}>
                {mode === 'merge' ? 'Merge PDFs' : mode === 'extract' ? 'Extract pages' : 'Create organized PDF'}
              </button>
            </div>
          )}
          <p className="note">No upload, no account, and no watermark.</p>
        </section>
      </div>
    </main>
  )
}
