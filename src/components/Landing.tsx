import { useState } from 'react'
import { converters } from '../converters'
import type { Converter } from '../converters'

const STEPS = [
  { title: 'Choose a format', text: 'Pick the conversion you need — image, HEIC, document, or data.' },
  { title: 'Drop your file', text: 'Drag and drop, or click to browse. Files never leave your device.' },
  { title: 'Download', text: 'Get your converted file instantly — saved only in your browser.' },
]

export function LandingPage() {
  const [detail, setDetail] = useState<Converter | null>(null)

  return (
    <main className="main">
      <section className="landing-hero">
        <div className="hero-pills">
          <span className="hero-pill">100% free</span>
          <span className="hero-pill">Safe &amp; private</span>
          <span className="hero-pill">No signup</span>
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

      <section className="formats-section">
        <h2 className="section-title">What you can convert</h2>
        <p className="section-sub">Pick a conversion — it all happens in your browser, nothing is uploaded.</p>
      </section>

      <section className="converters" aria-label="What you can convert">
        {converters.map((c) => (
          <button
            key={c.id}
            type="button"
            className="converter-card"
            onClick={() => setDetail(c)}
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

      <HowItWorks />
      <PrivacySection />

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

function HowItWorks() {
  return (
    <section className="how" id="how">
      <h2 className="section-title">How it works</h2>
      <p className="section-sub">Three steps. No account, no uploads.</p>
      <div className="how-steps">
        {STEPS.map((step, i) => (
          <div className="how-step" key={step.title}>
            <span className="how-step-num">{i + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function PrivacySection() {
  return (
    <section className="privacy">
      <h2>Your files never leave your device.</h2>
      <p className="section-sub">
        Everything is processed locally in your browser — private by design, for medical records,
        legal documents, and student work.
      </p>
      <ul className="privacy-list">
        <li>Converted locally in your browser</li>
        <li>Nothing is uploaded to a server</li>
        <li>No accounts, no tracking, no ads</li>
      </ul>
    </section>
  )
}
