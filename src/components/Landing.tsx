import { useState } from 'react'
import { converters, groupConvertersByCategory } from '../converters'
import type { Converter } from '../converters'
import { Showcase } from './Showcase'

const STEPS = [
  { title: 'Choose a format', text: 'Pick what you want to convert, like an iPhone photo to JPG.' },
  { title: 'Drop your file', text: 'Drag in a file or browse your device. Conversion happens in your browser.' },
  { title: 'Download', text: 'Save the converted file to your device. Your original stays untouched.' },
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
          <ol className="how-steps landing-how-steps">
            {STEPS.map((step, i) => (
              <li className="how-step" key={step.title}>
                <div className={`how-example how-example-${i + 1}`} aria-hidden="true">
                  {i === 0 ? (
                    <>
                      <span className="how-format">HEIC</span>
                      <span className="how-example-arrow">→</span>
                      <span className="how-format how-format-result">JPG</span>
                    </>
                  ) : i === 1 ? (
                    <div className="how-file-drop">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 3H6v18h12V7l-4-4Z M14 3v5h4 M9 13h6 M9 17h4" />
                      </svg>
                      <span>photo.heic</span>
                    </div>
                  ) : (
                    <div className="how-file-ready">
                      <span className="how-ready-check">✓</span>
                      <span>photo.jpg<small>Ready to save</small></span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3v12m-4-4 4 4 4-4M5 17v4h14v-4" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="how-step-label">Step {i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
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

const shieldIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3 5 6v5c0 4.4 3 8.4 7 9.5 4-1.1 7-5.1 7-9.5V6l-7-3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

const OFFERS = [
  { title: 'Private by design', text: 'Your files never leave your device. Everything is converted right in your browser.', tint: 'tint-blue', icon: shieldIcon },
  { title: 'Free forever', text: 'No signup, no ads, no watermarks. Convert single files for free.', tint: 'tint-green', icon: sparkleIcon },
  { title: 'Instant results', text: 'No upload queue, no waiting for a server. Conversion runs at your machine’s speed.', tint: 'tint-violet', icon: boltIcon },
]

function OfferSection() {
  return (
    <section className="offer">
      <div className="offer-head">
        <span className="offer-eyebrow">Privacy-first file conversion</span>
        <h2 className="section-title">What we offer</h2>
        <p className="section-sub">
          Convert images, documents, e-books, and spreadsheets — right in your browser, nothing
          uploaded.
        </p>
      </div>

      <div className="offer-grid">
        {OFFERS.map((o) => (
          <article className="offer-card" key={o.title}>
            <span className={`offer-icon-badge ${o.tint}`} aria-hidden="true">
              {o.icon}
            </span>
            <h3>{o.title}</h3>
            <p>{o.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
