import { useEffect, useState } from 'react'
import { ConverterPage } from './components/ConverterPage'
import { HowItWorksPage } from './components/HowItWorks'
import { LandingPage } from './components/Landing'
import { LegalNoticePage, OpenSourcePage, PrivacyPage, TermsPage } from './components/Legal'

function App() {
  const [route, setRoute] = useState(() => window.location.hash)

  useEffect(() => {
    const onChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  const isTool = route.startsWith('#/tool')
  const isHowItWorks = route.startsWith('#/how-it-works')
  const isTerms = route.startsWith('#/terms')
  const isPrivacy = route.startsWith('#/privacy')
  const isLegalNotice = route.startsWith('#/legal-notice')
  const isOpenSource = route.startsWith('#/open-source')

  return (
    <div className="page">
      <header className="header">
        <a className="brand" href="#/">
          <img className="brand-logo" src="/favicon.png?v=2" alt="FoldenLoom" width="28" height="28" />
          FoldenLoom
        </a>
        <div className="header-actions">
          <span className="badge">Private &amp; secure</span>
        </div>
      </header>

      {isTool ? (
        <ConverterPage />
      ) : isHowItWorks ? (
        <HowItWorksPage />
      ) : isTerms ? (
        <TermsPage />
      ) : isPrivacy ? (
        <PrivacyPage />
      ) : isLegalNotice ? (
        <LegalNoticePage />
      ) : isOpenSource ? (
        <OpenSourcePage />
      ) : (
        <LandingPage />
      )}

      <footer className="footer">
        <p>Convert files privately, right in your browser.</p>
        <p className="footer-sub">Nothing is uploaded. No accounts, no tracking.</p>
        <nav className="footer-links" aria-label="Legal">
          <a href="#/how-it-works">How it works</a>
          <a href="#/terms">Terms &amp; Conditions</a>
          <a href="#/privacy">Privacy Policy</a>
          <a href="#/legal-notice">Legal Notice</a>
          <a href="#/open-source">Open Source Licenses</a>
          <a
            href="https://github.com/MikeEgert/Format-conversion"
            target="_blank"
            rel="noreferrer"
            title="Opens GitHub in a new tab"
          >
            Open source <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </footer>

    </div>
  )
}

export default App
