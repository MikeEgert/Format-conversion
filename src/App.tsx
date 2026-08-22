import { useEffect, useState } from 'react'
import { ConverterPage } from './components/ConverterPage'
import { LandingPage } from './components/Landing'
import { LegalNoticePage, PrivacyPage, TermsPage } from './components/Legal'

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
  const isTerms = route.startsWith('#/terms')
  const isPrivacy = route.startsWith('#/privacy')
  const isLegalNotice = route.startsWith('#/legal-notice')

  return (
    <div className="page">
      <header className="header">
        <a className="brand" href="#/">
          <svg className="brand-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M8 13h8M8 16h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          FoldenLoom
        </a>
        <div className="header-actions">
          <span className="badge">Private &amp; secure</span>
        </div>
      </header>

      {isTool ? (
        <ConverterPage />
      ) : isTerms ? (
        <TermsPage />
      ) : isPrivacy ? (
        <PrivacyPage />
      ) : isLegalNotice ? (
        <LegalNoticePage />
      ) : (
        <LandingPage />
      )}

      <footer className="footer">
        <p>Convert files privately, right in your browser.</p>
        <p className="footer-sub">Nothing is uploaded. No accounts, no tracking.</p>
        <nav className="footer-links" aria-label="Legal">
          <a href="#/terms">Terms &amp; Conditions</a>
          <a href="#/privacy">Privacy Policy</a>
          <a href="#/legal-notice">Legal Notice</a>
        </nav>
      </footer>
    </div>
  )
}

export default App
