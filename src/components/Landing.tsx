import { useState } from 'react'
import { converters, groupConvertersByCategory } from '../converters'
import type { Converter } from '../converters'
import { MAX_FILE_BYTES, MAX_IMAGE_DIMENSION } from '../converters/helpers'
import { MAX_DOCX_UNCOMPRESSED_BYTES } from '../converters/docxToMarkdown'
import { Showcase } from './Showcase'

const STEPS = [
  { title: 'Choose a format', text: 'Pick the conversion you need — image, HEIC, document, or data.' },
  { title: 'Drop your file', text: 'Drag and drop, or click to browse. Files never leave your device.' },
  { title: 'Download', text: 'Get your converted file instantly — saved only in your browser.' },
]

function ConverterCardContent({ c }: { c: Converter }) {
  return (
    <>
      <span className="converter-badges">
        <span className="from">{c.fromLabel}</span>
        <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="to">{c.toLabel}</span>
      </span>
      <span className="converter-name">{c.name}</span>
      <span className="converter-desc">{c.description}</span>
    </>
  )
}

export function LandingPage() {
  const [detail, setDetail] = useState<Converter | null>(null)

  return (
    <main className="main">
      <section className="landing-hero">
        <h1>Convert files in your browser. Privately.</h1>
        <div className="hero-copy">
          <div className="hero-pills">
            <span className="hero-pill">100% free</span>
            <span className="hero-pill">No signup</span>
            <span className="hero-pill">No uploads</span>
            <a
              className="hero-pill"
              href="https://github.com/MikeEgert/Format-conversion"
              target="_blank"
              rel="noreferrer"
              title="Opens GitHub in a new tab"
            >
              100% open source <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="hero-sub">
            Images, HEIC photos, Word documents, e-books, and spreadsheets — converted right in
            your browser. Nothing is uploaded, and nothing ever leaves your device.
          </p>
          <div className="hero-actions">
            <a href="#/tool" className="btn btn-primary">
              Start converting
            </a>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
            >
              How it works
            </button>
          </div>
        </div>
        <Showcase />
      </section>

      <OfferSection />

      <section className="how" id="how">
        <h2 className="section-title">How it works</h2>
        <p className="section-sub">Three steps. No account, no uploads.</p>
        <div className="how-showcase">
          <div className="how-steps">
            {STEPS.map((step, i) => (
              <div className="how-step" key={step.title}>
                <span className="how-step-num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="formats-section" aria-label="What you can convert">
        <h2 className="section-title">What you can convert</h2>
        <p className="section-sub">Pick a conversion — it all happens in your browser, nothing is uploaded.</p>
        <div className="converters-groups">
          {groupConvertersByCategory(converters).map((group) => (
            <div key={group.category} className="converter-group">
              <h3 className="converter-group-title">{group.category}</h3>
              <div className="converter-group-grid">
                {group.converters.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="converter-card"
                    onClick={() => setDetail(c)}
                  >
                    <ConverterCardContent c={c} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={detail.name}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="converter-badges">
              <span className="from">{detail.fromLabel}</span>
              <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="to">{detail.toLabel}</span>
            </span>
            <h2>{detail.name}</h2>
            <p className="modal-copy">{detail.detail?.about}</p>
            {detail.detail?.useCases && detail.detail.useCases.length > 0 && (
              <>
                <h3 className="modal-heading">When to use it</h3>
                <ul className="modal-list">
                  {detail.detail.useCases.map((useCase) => (
                    <li key={useCase}>{useCase}</li>
                  ))}
                </ul>
              </>
            )}
            {detail.detail?.accepts && detail.detail.accepts.length > 0 && (
              <p className="modal-hint">Accepts: {detail.detail.accepts.join(', ')}</p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDetail(null)}>
                Close
              </button>
              <a href={`#/tool?converter=${detail.id}`} className="btn btn-primary">
                Start converting
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

const cycleArrow = (
  <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CYCLES: [from: string, to: string][] = [
  ['HEIC', 'JPG'],
  ['DOCX', 'MD'],
  ['XLSX', 'CSV'],
]

const cloudOffIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const sparkleIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

const boltIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
)

const codeIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m8.5 7-5 5 5 5m7-10 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const layersIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="m3 12.5 9 4.5 9-4.5M3 17l9 4.5L21 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SMALL_OFFERS = [
  { title: 'No uploads', text: 'Nothing is sent to a server. Not even a copy.', tint: 'tint-green', icon: cloudOffIcon },
  { title: 'No signup', text: 'No accounts, no cookies, no ads. Just convert.', tint: 'tint-amber', icon: sparkleIcon },
  { title: 'Instant results', text: 'No upload queue, no round-trip. Conversion runs at your machine’s speed.', tint: 'tint-violet', icon: boltIcon },
]

function OfferSection() {
  return (
    <section className="offer">
      <div className="offer-head">
        <span className="offer-eyebrow">Privacy-first file conversion</span>
        <h2 className="section-title">What we offer</h2>
        <p className="section-sub">
          Built for the files you wouldn’t dare upload elsewhere — medical records, legal
          documents, and student work.
        </p>
      </div>

      <div className="offer-grid">
        <article className="offer-card offer-feature">
          <span className="offer-icon-badge tint-blue" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3 5 6v5c0 4.4 3 8.4 7 9.5 4-1.1 7-5.1 7-9.5V6l-7-3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h3>Private by design</h3>
          <p className="offer-copy">
            Every conversion runs inside this browser tab — your file is read, converted, and
            handed back entirely on your device. Nothing is stored, queued, or shared anywhere
            else.
          </p>
          <div className="offer-visual" aria-hidden="true">
            <div className="offer-device">
              <span className="offer-device-label">Your device</span>
              <svg className="offer-file" viewBox="0 0 24 24">
                <path d="M7 3h7l5 5v13H7Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
              <span className="offer-cycle">
                {CYCLES.map(([from, to]) => (
                  <span className="offer-cycle-item converter-badges" key={from}>
                    <span className="from">{from}</span>
                    {cycleArrow}
                    <span className="to">{to}</span>
                  </span>
                ))}
              </span>
              <span className="offer-lock">
                <svg viewBox="0 0 24 24">
                  <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" fill="currentColor" />
                  <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
                </svg>
              </span>
            </div>
            <span className="offer-link-wrap">
              <svg className="offer-link" viewBox="0 0 44 24">
                <line x1="4" y1="12" x2="33" y2="12" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 4" />
                <path d="m32.5 7.5 7 4.5-7 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle className="offer-link-x" cx="18.5" cy="12" r="7.5" />
                <path className="offer-link-xt" d="m16 9.5 5 5m0-5-5 5" fill="none" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <div className="offer-cloud">
              <svg className="offer-cloud-icon" viewBox="0 0 24 24">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <line className="slash" x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="offer-cloud-value">0 bytes</span>
              <span className="offer-cloud-label">ever uploaded</span>
            </div>
          </div>
        </article>

        {SMALL_OFFERS.map((o) => (
          <article className="offer-card" key={o.title}>
            <span className={`offer-icon-badge ${o.tint}`} aria-hidden="true">
              {o.icon}
            </span>
            <h3>{o.title}</h3>
            <p>{o.text}</p>
          </article>
        ))}

        <article className="offer-card">
          <span className="offer-icon-badge tint-cyan" aria-hidden="true">
            {codeIcon}
          </span>
          <h3>Free &amp; open source</h3>
          <p>
            Free for single files, forever — and the code is public, so you can inspect every
            line on{' '}
            <a href="https://github.com/MikeEgert/Format-conversion" target="_blank" rel="noreferrer">
              GitHub
            </a>
            .
          </p>
        </article>

        <article className="offer-card offer-card-pro">
          <span className="offer-icon-badge tint-blue" aria-hidden="true">
            {layersIcon}
          </span>
          <h3>
            Batch &amp; ZIP <span className="offer-tag">Pro</span>
          </h3>
          <p>Convert whole folders at once and download everything as a single ZIP — unlocked with a Pro key.</p>
        </article>

        <div className="offer-stats">
          <p className="offer-stats-cap">
            <strong>Guardrails</strong> — hard limits that keep your tab responsive and stop
            malicious files before they’re decoded.
          </p>
          <div className="offer-stats-grid">
            {SPECS.map((spec) => (
              <div className="offer-stat" key={spec.label}>
                <span className="offer-stat-head">
                  {spec.icon}
                  <span className="offer-stat-value">{spec.value}</span>
                </span>
                <span className="offer-stat-label">{spec.label}</span>
                <span className="offer-stat-detail">{spec.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const SPECS = [
  {
    value: `${MAX_FILE_BYTES / (1024 * 1024)} MB`,
    label: 'max file size',
    detail: 'Kept so the tab stays responsive — larger files would exhaust the browser memory.',
    icon: (
      <svg className="offer-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h7l5 5v13H7Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 12v4m0 0 2-2m-2 2-2-2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: `${MAX_IMAGE_DIMENSION.toLocaleString()} px`,
    label: 'max image side',
    detail: 'An anti-freeze guard: image dimensions are checked before any pixels are decoded.',
    icon: (
      <svg className="offer-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="m4 17 5-4 4 3 3-2 4 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="9" cy="10" r="1.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: `${MAX_DOCX_UNCOMPRESSED_BYTES / (1024 * 1024)} MB`,
    label: 'docs & e-books, uncompressed',
    detail: 'DOCX and EPUB are also capped by total uncompressed size, stopping zip-bombs.',
    icon: (
      <svg className="offer-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8 13h8m-8 3h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'All browsers',
    label: 'Chrome, Edge, Firefox, Safari',
    detail: 'No install needed. HEIC decoding uses WebAssembly, supported by all four.',
    icon: (
      <svg className="offer-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 9h17M3.5 15h17M12 3c2.5 2.4 3.8 5.6 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
]
