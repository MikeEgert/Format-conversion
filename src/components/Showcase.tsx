import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Phase =
  | 'finder'
  | 'lift'
  | 'drag'
  | 'hover'
  | 'working'
  | 'done'
  | 'settings'
  | 'menu'
  | 'reworking'
  | 'final'

const STEPS: { phase: Phase; delay: number }[] = [
  { phase: 'lift', delay: 1000 },
  { phase: 'drag', delay: 650 },
  { phase: 'hover', delay: 1250 },
  { phase: 'working', delay: 550 },
  { phase: 'done', delay: 1550 },
  { phase: 'settings', delay: 1500 },
  { phase: 'menu', delay: 850 },
  { phase: 'reworking', delay: 1150 },
  { phase: 'final', delay: 1450 },
  { phase: 'finder', delay: 2600 },
]

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function centerOf(el: HTMLElement, body: HTMLElement): { x: number; y: number } {
  const bodyRect = body.getBoundingClientRect()
  const rect = el.getBoundingClientRect()
  return {
    x: ((rect.left + rect.width / 2 - bodyRect.left) / bodyRect.width) * 100,
    y: ((rect.top + rect.height / 2 - bodyRect.top) / bodyRect.height) * 100,
  }
}

export function Showcase() {
  const frameRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)
  const qualityRef = useRef<HTMLSpanElement>(null)
  const balancedRef = useRef<HTMLSpanElement>(null)
  const pointerRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>(() =>
    prefersReducedMotion() ? 'final' : 'finder',
  )
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const frame = frameRef.current
    if (!frame || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
      if (!entry.isIntersecting) setPhase('finder')
    }, { threshold: 0.25 })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return
    let timer = 0
    let index = 0

    const advance = () => {
      const step = STEPS[index]
      timer = window.setTimeout(() => {
        setPhase(step.phase)
        index = (index + 1) % STEPS.length
        advance()
      }, step.delay)
    }

    advance()
    return () => window.clearTimeout(timer)
  }, [inView])

  useLayoutEffect(() => {
    if (phase !== 'lift' && phase !== 'drag' && phase !== 'hover') return

    const updatePosition = () => {
      const target = phase === 'lift' ? fileRef.current : dropRef.current
      const body = bodyRef.current
      const ghost = ghostRef.current
      if (!target || !body || !ghost) return
      const { x, y } = centerOf(target, body)
      ghost.style.setProperty('--x', `${x}%`)
      ghost.style.setProperty('--y', `${y}%`)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [phase])

  useLayoutEffect(() => {
    if (phase !== 'settings' && phase !== 'menu') return

    const updatePosition = () => {
      const target = phase === 'settings' ? qualityRef.current : balancedRef.current
      const body = bodyRef.current
      const pointer = pointerRef.current
      if (!target || !body || !pointer) return
      const { x, y } = centerOf(target, body)
      pointer.style.setProperty('--x', `${x}%`)
      pointer.style.setProperty('--y', `${y}%`)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [phase])

  const showFinder = phase === 'finder' || phase === 'lift' || phase === 'drag' || phase === 'hover'
  const dragging = phase === 'lift' || phase === 'drag' || phase === 'hover'
  const overDrop = phase === 'hover'
  const showResult = phase === 'done' || phase === 'settings' || phase === 'menu' || phase === 'final'
  const balancedQuality = phase === 'reworking' || phase === 'final'

  return (
    <div className="showcase" aria-hidden="true">
      <div ref={frameRef} className="showcase-frame">
        <div className="showcase-chrome">
          <span className="showcase-dots"><i /><i /><i /></span>
          <span className="showcase-url">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            format-conversion.workers.dev
          </span>
        </div>

        <div ref={bodyRef} className="showcase-body">
          <div className="showcase-app-header">
            <span className="showcase-app-brand"><img src="/favicon.png" alt="" width="17" height="17" />FoldenLoom</span>
            <span>Converters&nbsp;&nbsp;⌄</span>
          </div>

          <div className="showcase-workspace">
            <div className="showcase-settings">
              <span className="showcase-eyebrow">Output settings</span>
              <strong className="showcase-panel-title">Adjust output</strong>
              <span className="showcase-field-label">Convert to</span>
              <span className="showcase-select">WebP <span>⌄</span></span>
              <span className="showcase-field-label">Size</span>
              <span className="showcase-select">Original <span>⌄</span></span>
              <span className="showcase-field-label">Quality</span>
              <div className="showcase-quality-field">
                <span
                  ref={qualityRef}
                  className={phase === 'settings' || phase === 'menu' ? 'showcase-select is-target' : 'showcase-select'}
                >
                  {balancedQuality ? 'Balanced · 80%' : 'High · 90%'} <span>⌄</span>
                </span>
                {phase === 'menu' && (
                  <div className="showcase-quality-menu">
                    <span>Very low · 30%</span>
                    <span>Low · 50%</span>
                    <span ref={balancedRef} className="is-choice">Balanced · 80%</span>
                    <span className="is-current">High · 90%</span>
                  </div>
                )}
              </div>
              <span className="showcase-privacy">Your files stay on your device.</span>
            </div>

            <div className="showcase-stage">
              {phase === 'working' || phase === 'reworking' ? (
                <div className="showcase-working">
                  <span className="spinner" />
                  <strong>{phase === 'reworking' ? 'Updating dog.webp…' : 'Converting dog.jpg…'}</strong>
                  <span className="showcase-progress"><span /></span>
                  <span className="showcase-working-file">dog.jpg <span>Converting…</span></span>
                </div>
              ) : showResult ? (
                <div className="showcase-result">
                  <div className="showcase-result-head">
                    <div><strong>dog.webp</strong><span>800 × 450 · Ready to download</span></div>
                    <span className="showcase-download">Download</span>
                  </div>
                  <img src="/demo-dog.jpg" alt="" width="800" height="450" />
                </div>
              ) : (
                <div ref={dropRef} className={overDrop ? 'showcase-drop is-over' : 'showcase-drop'}>
                  <span className="showcase-drop-action">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 16V4m0 0L8 8m4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Select a file
                  </span>
                  <span className="showcase-drop-hint">or drag files here</span>
                </div>
              )}
            </div>

            <div className="showcase-types">
              <span className="showcase-eyebrow">Conversion type</span>
              <strong className="showcase-panel-title">Choose a format</strong>
              <span className="showcase-eyebrow">Images</span>
              <span className="showcase-type is-active"><strong>Image</strong><small>Image → JPG/PNG/WebP</small></span>
              <span className="showcase-type"><strong>HEIC to JPG</strong><small>HEIC → JPG</small></span>
              <span className="showcase-eyebrow showcase-documents">Documents</span>
              <span className="showcase-type"><strong>PDF to DOCX</strong><small>PDF → DOCX</small></span>
            </div>
          </div>

          {showFinder && (
            <div className={phase === 'drag' ? 'showcase-finder is-moving' : phase === 'hover' ? 'showcase-finder is-leaving' : 'showcase-finder'}>
              <div className="showcase-finder-sidebar">
                <span className="showcase-finder-dots"><i /><i /><i /></span>
                <span className="showcase-finder-section">Favorites</span>
                <span className="showcase-finder-location">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M8 3.5V8l3 1.5" /></svg>
                  Recents
                </span>
                <span className="showcase-finder-location">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5h4l1.5 1.5H14v6.5H2z" /><path d="M2 5V3h5l1 1h6v2.5" /></svg>
                  Desktop
                </span>
                <span className="showcase-finder-location is-selected">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12v10H2z" /><path d="M4 5h8M4 8h8" /></svg>
                  Pictures
                </span>
                <span className="showcase-finder-location">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8m0 0-3-3m3 3 3-3M3 11v2h10v-2" /></svg>
                  Downloads
                </span>
              </div>
              <div className="showcase-finder-main">
                <div className="showcase-finder-toolbar">
                  <span className="showcase-finder-back">‹ <span>›</span></span>
                  <strong>Pictures</strong>
                  <span className="showcase-finder-view" aria-hidden="true">
                    <svg viewBox="0 0 16 16"><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>
                    <svg viewBox="0 0 16 16"><path d="M5 4h9M5 8h9M5 12h9" /><circle cx="2" cy="4" r="0.5" /><circle cx="2" cy="8" r="0.5" /><circle cx="2" cy="12" r="0.5" /></svg>
                  </span>
                  <svg className="showcase-finder-search" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4" /><path d="m10 10 4 4" /></svg>
                </div>
                <div className="showcase-finder-files">
                  <div ref={fileRef} className={dragging ? 'showcase-finder-file is-dragging' : 'showcase-finder-file'}>
                    <img src="/demo-dog.jpg" alt="" width="800" height="450" />
                    <span>dog.jpg</span>
                  </div>
                  <div className="showcase-finder-file">
                    <span className="showcase-finder-folder" />
                    <span>Albums</span>
                  </div>
                </div>
                <span className="showcase-finder-status">2 items</span>
              </div>
            </div>
          )}

          {dragging && (
            <div ref={ghostRef} className="showcase-drag-ghost">
              <img src="/demo-dog.jpg" alt="" width="800" height="450" />
              <span>dog.jpg</span>
              <svg className="showcase-drag-cursor" viewBox="0 0 28 28" aria-hidden="true">
                <path d="M4 2 L4 24 L10 18 L14 26 L17 24.5 L13 16.5 L21 16.5 Z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {(phase === 'settings' || phase === 'menu') && (
            <div ref={pointerRef} className="showcase-settings-pointer">
              <svg viewBox="0 0 28 28" aria-hidden="true">
                <path d="M4 2 L4 24 L10 18 L14 26 L17 24.5 L13 16.5 L21 16.5 Z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
