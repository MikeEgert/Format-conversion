import { converters, groupConvertersByCategory } from '../converters'
import type { Converter } from '../converters'
import { Showcase } from './Showcase'

const featuredIds = ['heic-to-jpg', 'pdf-to-docx', 'image', 'csv-to-json']
const featuredConverters = featuredIds
  .map((id) => converters.find((converter) => converter.id === id))
  .filter((converter): converter is Converter => Boolean(converter))
const converterGroups = groupConvertersByCategory(converters)

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {diagonal ? <path d="M5 19 19 5M8 5h11v11" /> : <path d="M4 12h16m-6-6 6 6-6 6" />}
    </svg>
  )
}

function ConverterRow({ converter }: { converter: Converter }) {
  const detail = converter.detail

  return (
    <li className="landing-converter">
      <a className="landing-converter-link" href={`#/tool?converter=${converter.id}`}>
        <span className="landing-format-pair">
          {converter.fromLabel} <span aria-hidden="true">→</span> {converter.toLabel}
        </span>
        <span className="landing-converter-summary">
          <strong>{converter.name}</strong>
          <span>{converter.description}</span>
        </span>
        <Arrow />
      </a>
      {detail && (
        <details className="landing-converter-detail">
          <summary aria-label={`Details about ${converter.name}`}>Details</summary>
          <div>
            <p>{detail.about}</p>
            {detail.useCases && detail.useCases.length > 0 && (
              <ul>
                {detail.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}
              </ul>
            )}
            {detail.accepts && detail.accepts.length > 0 && (
              <p className="landing-accepts">Accepts: {detail.accepts.join(', ')}</p>
            )}
          </div>
        </details>
      )}
    </li>
  )
}

function ConverterGroup({ group }: { group: (typeof converterGroups)[number] }) {
  return (
    <section className="landing-category" aria-labelledby={`landing-category-${group.category}`}>
      <div className="landing-category-heading">
        <span className="landing-category-label">File type</span>
        <h3 id={`landing-category-${group.category}`}>{group.category}</h3>
        <span className="landing-category-count">
          {group.converters.length} {group.converters.length === 1 ? 'conversion' : 'conversions'}
        </span>
      </div>
      <ul className="landing-converter-list">
        {group.converters.map((converter) => (
          <ConverterRow key={converter.id} converter={converter} />
        ))}
      </ul>
    </section>
  )
}

export function LandingPage() {
  return (
    <main className="main landing-page">
      <section className="landing-intro" aria-labelledby="landing-title">
        <div className="landing-intro-main">
          <span className="landing-eyebrow">Private file conversion</span>
          <h1 id="landing-title">Convert files without uploading them.</h1>
          <p className="landing-lead">
            Turn photos, documents, e-books, and data into the format you need. Your file is
            processed in your browser and stays on your device.
          </p>
          <div className="landing-actions">
            <button
              type="button"
              className="landing-primary-action"
              onClick={() => document.getElementById('conversions')?.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
              })}
            >
              Choose a conversion <Arrow />
            </button>
            <a href="#/how-it-works" className="landing-text-link">See how it works</a>
          </div>
          <p className="landing-intro-note">File conversion is free, including batches. No account, ads, or watermarks.</p>
        </div>

        <aside className="landing-quick" aria-labelledby="landing-quick-title">
          <span className="landing-eyebrow">Start here</span>
          <h2 id="landing-quick-title">Common conversions</h2>
          <ul>
            {featuredConverters.map((converter) => (
              <li key={converter.id}>
                <a href={`#/tool?converter=${converter.id}`}>
                  <span>{converter.id === 'image' ? 'PNG, JPG & WebP' : converter.name}</span>
                  <Arrow diagonal />
                </a>
              </li>
            ))}
          </ul>
          <p>Select a format, choose your file, then save the result.</p>
        </aside>
      </section>

      <section className="landing-directory" id="conversions" aria-labelledby="conversions-title">
        <div className="landing-section-heading">
          <span className="landing-eyebrow">All tools / {converters.length} conversions</span>
          <h2 id="conversions-title">Choose a conversion.</h2>
          <p>Choose a conversion to open the tool. You can check its details before you begin.</p>
        </div>
        <div className="landing-categories">
          {converterGroups.map((group) => (
            <ConverterGroup key={group.category} group={group} />
          ))}
        </div>
      </section>

      <section className="landing-pdf-feature" aria-labelledby="landing-pdf-title">
        <div>
          <span className="landing-eyebrow">A different kind of PDF tool</span>
          <h2 id="landing-pdf-title">Merge and organize PDFs without uploading them.</h2>
          <p>
            Combine documents, extract page ranges, rotate pages, or remove pages directly in your
            browser. No account, watermark, or server copy.
          </p>
          <a href="#/pdf-tools" className="landing-inline-link">
            Open PDF tools <Arrow diagonal />
          </a>
        </div>
        <ul className="landing-pdf-feature-list">
          <li><strong>Merge</strong><span>Combine multiple PDFs into one file.</span></li>
          <li><strong>Extract</strong><span>Keep only the pages you need.</span></li>
          <li><strong>Organize</strong><span>Reorder, rotate, and remove pages.</span></li>
        </ul>
      </section>

      <section className="landing-demo" aria-labelledby="landing-demo-title">
        <div className="landing-demo-copy">
          <span className="landing-eyebrow">See it in action</span>
          <h2 id="landing-demo-title">See a conversion from start to finish.</h2>
          <p>
            Choose a conversion, drag in a file, adjust the output settings, and download the
            result. It all happens in your browser.
          </p>
          <a href="#/tool" className="landing-inline-link">
            Try the converter <Arrow diagonal />
          </a>
        </div>
        <Showcase />
      </section>

      <section className="landing-process" aria-labelledby="landing-process-title">
        <div>
          <span className="landing-eyebrow">Your file, your device</span>
          <h2 id="landing-process-title">No upload step. No server copy.</h2>
          <p>
            Conversion happens inside your browser tab. We never receive or store your file, and
            the downloaded result comes from your device's memory.
          </p>
          <a href="#/how-it-works" className="landing-inline-link">
            Read how local conversion works <Arrow diagonal />
          </a>
        </div>
        <ol className="landing-process-steps">
          <li><span>01</span><div><strong>Choose a format</strong><p>Pick the result you need.</p></div></li>
          <li><span>02</span><div><strong>Select your file</strong><p>Your browser reads and converts it locally.</p></div></li>
          <li><span>03</span><div><strong>Save the result</strong><p>Download the new file. Your original stays untouched.</p></div></li>
        </ol>
      </section>

      <section className="landing-practical" aria-labelledby="landing-practical-title">
        <div className="landing-section-heading">
          <span className="landing-eyebrow">The practical details</span>
          <h2 id="landing-practical-title">Good to know before you start.</h2>
        </div>
        <dl className="landing-facts">
          <div><dt>Free use</dt><dd>Convert single files or batches, with no signup, ads, or watermarks.</dd></div>
          <div><dt>Downloads</dt><dd>Download each result separately or save multiple results as a ZIP.</dd></div>
          <div><dt>File limits</dt><dd>Up to 100 MB per file. Images are capped at 16,384 px per side and 50 megapixels.</dd></div>
          <div><dt>Browsers</dt><dd>Current Chrome, Edge, Firefox, and Safari on desktop and mobile.</dd></div>
        </dl>
        <p className="landing-practical-note">
          This project is <a href="https://github.com/MikeEgert/Format-conversion" target="_blank" rel="noreferrer">open source <span aria-hidden="true">↗</span></a>.
          We use cookieless, aggregate page-view analytics; file contents and conversion activity are not tracked.
        </p>
      </section>
    </main>
  )
}
