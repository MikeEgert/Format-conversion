import { useState } from 'react'
import { converters, groupConvertersByCategory } from '../converters'
import type { Converter } from '../converters'
import { MAX_FILE_BYTES, MAX_IMAGE_DIMENSION } from '../converters/helpers'
import { MAX_DOCX_UNCOMPRESSED_BYTES } from '../converters/docxToMarkdown'
import { getLandingPage } from '../seo/landingPages'
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
        <h1>Convert files in your browser. Privately.</h1>
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
          <Showcase />
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
                {group.converters.map((c) => {
                  const landing = getLandingPage(c.id)
                  return landing ? (
                    <a key={c.id} className="converter-card" href={landing.path}>
                      <ConverterCardContent c={c} />
                    </a>
                  ) : (
                    <button
                      key={c.id}
                      type="button"
                      className="converter-card"
                      onClick={() => setDetail(c)}
                    >
                      <ConverterCardContent c={c} />
                    </button>
                  )
                })}
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

const OFFERS = [
  {
    title: '100% private',
    text: 'Everything runs locally in your browser — your files never leave your device.',
    icon: (
      <svg className="offer-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 5 6v5c0 4.4 3 8.4 7 9.5 4-1.1 7-5.1 7-9.5V6l-7-3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'No uploads',
    text: 'Nothing is sent to a server. Not even a copy.',
    icon: (
      <svg className="offer-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="11" width="14" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'No signup',
    text: 'No accounts, no cookies, no ads. Just convert.',
    icon: (
      <svg className="offer-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
]

function OfferSection() {
  return (
    <section className="offer">
      <h2 className="section-title">What we offer</h2>
      <p className="section-sub">
        Private by design — for medical records, legal documents, and student work.
      </p>
      <div className="offer-grid">
        {OFFERS.map((offer) => (
          <div className="offer-card" key={offer.title}>
            {offer.icon}
            <h3>{offer.title}</h3>
            <p>{offer.text}</p>
          </div>
        ))}
      </div>
      <div className="specs-block">
        <h3 className="specs-title">Good to know</h3>
        <p className="specs-sub">
          Honest limits — they keep conversions fast and stop a big or malicious file from
          freezing your tab.
        </p>
        <div className="specs">
          {SPECS.map((spec) => (
            <div className="spec" key={spec.label}>
              <span className="spec-value">{spec.value}</span>
              <span className="spec-label">{spec.label}</span>
              <span className="spec-detail">{spec.detail}</span>
            </div>
          ))}
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
  },
  {
    value: `${MAX_IMAGE_DIMENSION.toLocaleString()} px`,
    label: 'max image side',
    detail: 'An anti-freeze guard: image dimensions are checked before any pixels are decoded.',
  },
  {
    value: `${MAX_DOCX_UNCOMPRESSED_BYTES / (1024 * 1024)} MB`,
    label: 'docs & e-books, uncompressed',
    detail: 'DOCX and EPUB are also capped by total uncompressed size, stopping zip-bombs.',
  },
  {
    value: 'All browsers',
    label: 'Chrome, Edge, Firefox, Safari',
    detail: 'No install needed. HEIC decoding uses WebAssembly, supported by all four.',
  },
]
