import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

type Phase = 'hero' | 'pick' | 'drop' | 'dialog' | 'working' | 'done'

type Size = 'original' | 'small' | 'medium' | 'large'
type Quality = 'verylow' | 'low' | 'balanced' | 'high'

type Target =
  | 'hero-btn'
  | 'heic-card'
  | 'drop-zone'
  | 'file-dog'
  | 'size-medium'
  | 'quality-balanced'
  | 'download'

interface Step {
  target?: Target
  x?: number
  y?: number
  phase: Phase
  click?: boolean
  hold?: number
  size?: Size
  quality?: Quality
  downloaded?: boolean
}

const STEPS: Step[] = [
  { target: 'hero-btn', phase: 'hero' },
  { target: 'hero-btn', phase: 'hero' },
  { target: 'hero-btn', phase: 'hero', click: true },
  { target: 'heic-card', phase: 'pick' },
  { target: 'heic-card', phase: 'pick', click: true },
  { target: 'drop-zone', phase: 'drop' },
  { target: 'drop-zone', phase: 'drop', click: true },
  { target: 'file-dog', phase: 'dialog' },
  { target: 'file-dog', phase: 'dialog', click: true },
  { x: 24, y: 84, phase: 'working', hold: 1900 },
  { target: 'size-medium', phase: 'done' },
  { target: 'size-medium', phase: 'done', click: true, size: 'medium' },
  { target: 'quality-balanced', phase: 'done' },
  { target: 'quality-balanced', phase: 'done', click: true, quality: 'balanced' },
  { target: 'download', phase: 'done' },
  { target: 'download', phase: 'done', click: true, downloaded: true, hold: 1800 },
]

const SIZES: { id: Size; label: string; value?: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'small', label: 'Small', value: '800px' },
  { id: 'medium', label: 'Medium', value: '1280px' },
  { id: 'large', label: 'Large', value: '1920px' },
]

const QUALITIES: { id: Quality; label: string; value: string }[] = [
  { id: 'verylow', label: 'Very low', value: '30%' },
  { id: 'low', label: 'Low', value: '50%' },
  { id: 'balanced', label: 'Balanced', value: '80%' },
  { id: 'high', label: 'High', value: '90%' },
]

const FORMATS = ['JPG', 'PNG', 'WebP']

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function centerOf(el: HTMLElement, body: HTMLElement): { x: number; y: number } {
  const b = body.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  return {
    x: ((r.left + r.width / 2 - b.left) / b.width) * 100,
    y: ((r.top + r.height / 2 - b.top) / b.height) * 100,
  }
}

export function Showcase() {
  const bodyRef = useRef<HTMLDivElement>(null)
  const heroBtnRef = useRef<HTMLSpanElement>(null)
  const heicCardRef = useRef<HTMLDivElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const fileDogRef = useRef<HTMLButtonElement>(null)
  const sizeMediumRef = useRef<HTMLSpanElement>(null)
  const qualityBalancedRef = useRef<HTMLSpanElement>(null)
  const downloadRef = useRef<HTMLSpanElement>(null)

  const refs: Record<Target, { current: HTMLElement | null }> = useMemo(
    () => ({
      'hero-btn': heroBtnRef,
      'heic-card': heicCardRef,
      'drop-zone': dropZoneRef,
      'file-dog': fileDogRef,
      'size-medium': sizeMediumRef,
      'quality-balanced': qualityBalancedRef,
      download: downloadRef,
    }),
    [heroBtnRef, heicCardRef, dropZoneRef, fileDogRef, sizeMediumRef, qualityBalancedRef, downloadRef],
  )

  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [phase, setPhase] = useState<Phase>(() =>
    prefersReducedMotion() ? 'done' : STEPS[0].phase,
  )
  const [target, setTarget] = useState<Target | null>(() =>
    prefersReducedMotion() ? 'download' : null,
  )
  const [clickKey, setClickKey] = useState(0)
  const [size, setSize] = useState<Size>(() => (prefersReducedMotion() ? 'medium' : 'original'))
  const [quality, setQuality] = useState<Quality>(() =>
    prefersReducedMotion() ? 'balanced' : 'high',
  )
  const [downloaded, setDownloaded] = useState(() => prefersReducedMotion())
  const [fading, setFading] = useState(false)
  const [epoch, setEpoch] = useState(0)

  useLayoutEffect(() => {
    if (!target) return
    const body = bodyRef.current
    const el = refs[target].current
    if (body && el) setPos(centerOf(el, body))
  }, [target, phase, epoch, refs])

  useEffect(() => {
    if (prefersReducedMotion()) return

    let cancelled = false
    let timer = 0

    const run = (index: number) => {
      const step = STEPS[index]
      timer = window.setTimeout(() => {
        if (cancelled) return
        setPhase(step.phase)
        if (step.target) {
          setTarget(step.target)
        } else {
          setTarget(null)
          setPos({ x: step.x ?? 50, y: step.y ?? 50 })
        }
        if (step.size) setSize(step.size)
        if (step.quality) setQuality(step.quality)
        if (step.downloaded) setDownloaded(true)
        if (step.click) setClickKey((k) => k + 1)
        const next = index + 1
        if (next < STEPS.length) {
          run(next)
        } else {
          timer = window.setTimeout(() => {
            if (cancelled) return
            setFading(true)
            timer = window.setTimeout(() => {
              if (cancelled) return
              setDownloaded(false)
              setSize('original')
              setQuality('high')
              setFading(false)
              setEpoch((e) => e + 1)
            }, 320)
          }, 600)
        }
      }, index === 0 ? 200 : step.hold ?? (step.phase === 'working' ? 1600 : step.click ? 1100 : 1000))
    }

    run(0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [epoch])

  return (
    <div className="showcase" aria-hidden="true">
      <div className="showcase-frame">
        <div className="showcase-chrome">
          <span className="showcase-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="showcase-url">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            format-conversion.workers.dev
          </span>
        </div>

        <div ref={bodyRef} className={fading ? 'showcase-body fade' : 'showcase-body'}>
          {phase === 'hero' && <Hero heroBtnRef={heroBtnRef} />}
          {phase === 'pick' && <Pick heicCardRef={heicCardRef} />}
          {phase === 'drop' && <Drop dropZoneRef={dropZoneRef} />}
          {phase === 'dialog' && (
            <>
              <Drop dropZoneRef={dropZoneRef} />
              <FileDialog fileDogRef={fileDogRef} />
            </>
          )}
          {phase === 'working' && <Working />}
          {phase === 'done' && (
            <Done
              size={size}
              quality={quality}
              downloaded={downloaded}
              sizeMediumRef={sizeMediumRef}
              qualityBalancedRef={qualityBalancedRef}
              downloadRef={downloadRef}
            />
          )}

          {clickKey > 0 && (
            <span
              className="showcase-ripple"
              key={clickKey}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            />
          )}

          <span
            className="showcase-cursor"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <svg viewBox="0 0 28 28" aria-hidden="true">
              <path
                d="M4 2 L4 24 L10 18 L14 26 L17 24.5 L13 16.5 L21 16.5 Z"
                fill="#fff"
                stroke="#000"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}

function Hero({ heroBtnRef }: { heroBtnRef: { current: HTMLSpanElement | null } }) {
  return (
    <div className="showcase-hero">
      <span className="showcase-brand">
        <img src="/favicon.png" alt="" width="18" height="18" />
        FoldenLoom
      </span>
      <span className="showcase-hero-title">Convert files in your browser.</span>
      <span className="showcase-hero-sub">Privately. Nothing is uploaded.</span>
      <span ref={heroBtnRef} className="showcase-btn showcase-btn-primary">
        Start converting
      </span>
    </div>
  )
}

function Pick({ heicCardRef }: { heicCardRef: { current: HTMLDivElement | null } }) {
  return (
    <div className="showcase-pick">
      <span className="showcase-label">Choose a conversion</span>
      <div className="showcase-cards">
        <span className="showcase-card">
          <span className="showcase-badges">Image → JPG/PNG/WebP</span>
          <strong>Image</strong>
        </span>
        <div ref={heicCardRef} className="showcase-card active">
          <span className="showcase-badges">HEIC → JPG</span>
          <strong>HEIC to JPG</strong>
        </div>
        <span className="showcase-card">
          <span className="showcase-badges">DOCX → MD</span>
          <strong>Word to Markdown</strong>
        </span>
      </div>
    </div>
  )
}

function Drop({ dropZoneRef }: { dropZoneRef: { current: HTMLDivElement | null } }) {
  return (
    <div ref={dropZoneRef} className="showcase-drop">
      <svg className="showcase-drop-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 16V4m0 0L8 8m4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="showcase-drop-title">Drop files here</span>
      <span className="showcase-drop-hint">or click to browse — nothing is uploaded</span>
      <span className="showcase-chip">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="9" cy="10" r="1.6" fill="currentColor" />
          <path d="m4 17 5-4 4 3 3-2 4 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        dog.heic · 394 KB
      </span>
    </div>
  )
}

function FileDialog({ fileDogRef }: { fileDogRef: { current: HTMLButtonElement | null } }) {
  return (
    <div className="showcase-dialog">
      <div className="showcase-dialog-window">
        <div className="showcase-dialog-title">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          Select a file
        </div>
        <div className="showcase-dialog-list">
          <button className="showcase-file" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="9" cy="10" r="1.6" fill="currentColor" />
              <path d="m4 17 5-4 4 3 3-2 4 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            IMG_2456.heic
            <span className="showcase-file-meta">2.1 MB</span>
          </button>
          <button className="showcase-file" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="9" cy="10" r="1.6" fill="currentColor" />
              <path d="m4 17 5-4 4 3 3-2 4 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            cat.jpg
            <span className="showcase-file-meta">1.4 MB</span>
          </button>
          <button ref={fileDogRef} className="showcase-file selected" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="9" cy="10" r="1.6" fill="currentColor" />
              <path d="m4 17 5-4 4 3 3-2 4 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            dog.heic
            <span className="showcase-file-meta">394 KB</span>
          </button>
          <button className="showcase-file" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 3h7l5 5v13H7Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M10 12h6m-6 3h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            notes.docx
            <span className="showcase-file-meta">18 KB</span>
          </button>
        </div>
        <div className="showcase-dialog-actions">
          <span className="showcase-dialog-btn">Cancel</span>
          <span className="showcase-dialog-btn showcase-dialog-btn-primary">Open</span>
        </div>
      </div>
    </div>
  )
}

function Working() {
  return (
    <div className="showcase-working">
      <span className="spinner" aria-hidden="true" />
      <span className="showcase-working-text">Converting dog.heic…</span>
      <span className="showcase-progress">
        <span className="showcase-progress-bar" />
      </span>
    </div>
  )
}

function Done({
  size,
  quality,
  downloaded,
  sizeMediumRef,
  qualityBalancedRef,
  downloadRef,
}: {
  size: Size
  quality: Quality
  downloaded: boolean
  sizeMediumRef: { current: HTMLSpanElement | null }
  qualityBalancedRef: { current: HTMLSpanElement | null }
  downloadRef: { current: HTMLSpanElement | null }
}) {
  return (
    <div className="showcase-done">
      <div className="showcase-pickers">
        <div className="showcase-picker">
          <span className="showcase-label">Convert to</span>
          <span className="showcase-options">
            {FORMATS.map((f) => (
              <span key={f} className={f === 'JPG' ? 'showcase-option active' : 'showcase-option'}>
                {f}
              </span>
            ))}
          </span>
        </div>
        <div className="showcase-picker">
          <span className="showcase-label">Size</span>
          <span className="showcase-options">
            {SIZES.map((s) => (
              <span
                key={s.id}
                ref={s.id === 'medium' ? sizeMediumRef : undefined}
                className={s.id === size ? 'showcase-option active' : 'showcase-option'}
              >
                {s.label}
                {s.value && <em>{s.value}</em>}
              </span>
            ))}
          </span>
        </div>
        <div className="showcase-picker">
          <span className="showcase-label">Quality</span>
          <span className="showcase-options">
            {QUALITIES.map((q) => (
              <span
                key={q.id}
                ref={q.id === 'balanced' ? qualityBalancedRef : undefined}
                className={q.id === quality ? 'showcase-option active' : 'showcase-option'}
              >
                {q.label}
                <em>{q.value}</em>
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className="showcase-result">
        <div className="showcase-result-meta">
          <span className="showcase-result-name">dog.jpg</span>
          <span className="showcase-result-size">
            394 KB <span className="size-arrow">&rarr;</span>{' '}
            <span className="size-out">73 KB</span>
          </span>
          <span
            ref={downloadRef}
            className={downloaded ? 'showcase-btn showcase-btn-primary done' : 'showcase-btn showcase-btn-primary'}
          >
            {downloaded ? 'Saved' : 'Download'}
          </span>
        </div>
        <div className="showcase-result-preview">
          <img src="/demo-dog.jpg" alt="" width="800" height="450" />
        </div>
      </div>
    </div>
  )
}