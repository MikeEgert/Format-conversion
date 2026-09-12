import { useEffect } from 'react'
import { converters } from '../converters'
import type { LandingPageData } from '../seo/landingPages'

function setMetaTag(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

interface Props {
  page: LandingPageData
}

export function ConverterLanding({ page }: Props) {
  const converter = converters.find((c) => c.id === page.id)
  const ctaLabel = converter
    ? `Convert ${converter.fromLabel} to ${converter.toLabel}`
    : page.h1

  useEffect(() => {
    document.title = page.title
    setMetaTag('description', page.description)
    setCanonical(window.location.origin + page.path)
  }, [page])

  return (
    <main className="main">
      <a className="btn btn-ghost landing-back" href="#/">
        &larr; Back
      </a>
      <section className="landing-hero">
        <div className="hero-pills">
          <span className="hero-pill">100% free</span>
          <span className="hero-pill">No upload</span>
          <span className="hero-pill">No signup</span>
        </div>
        <h1>{page.h1}</h1>
        <p className="hero-sub">{page.subtitle}</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href={`#/tool?converter=${page.id}`}>
            {ctaLabel}
          </a>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="section-title">How to convert {converter ? `${converter.fromLabel} to ${converter.toLabel}` : ''}</h2>
        <p className="section-sub">Three steps. No account, no uploads.</p>
        <div className="how-steps">
          {page.steps.map((step, i) => (
            <div className="how-step" key={step.title}>
              <span className="how-step-num">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {page.useCases.length > 0 && (
        <section className="landing-section">
          <h2 className="section-title">Why use it</h2>
          <ul className="landing-usecases">
            {page.useCases.map((useCase) => (
              <li key={useCase}>{useCase}</li>
            ))}
          </ul>
        </section>
      )}

      {page.faq.length > 0 && (
        <section className="landing-section">
          <h2 className="section-title">Frequently asked questions</h2>
          <div className="landing-faq">
            {page.faq.map((faq) => (
              <div className="landing-faq-item" key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
