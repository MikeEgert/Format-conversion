import { useEffect, useState } from 'react'
import { ConverterPage } from './components/ConverterPage'
import { HowItWorksPage } from './components/HowItWorks'
import { LandingPage } from './components/Landing'
import { LegalNoticePage, OpenSourcePage, PrivacyPage, TermsPage } from './components/Legal'

function App() {
  const [route, setRoute] = useState(() => window.location.hash)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  )

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

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
    setTheme(next)
  }

  const isDark = theme === 'dark'

  return (
    <div className="page">
      <header className="header">
        <a className="brand" href="#/">
          <img className="brand-logo" src="/favicon.png?v=2" alt="FoldenLoom" width="28" height="28" />
          FoldenLoom
        </a>
        <div className="header-actions">
          <nav className="header-nav" aria-label="Primary">
            <a className="nav-link" href="#/tool">
              Convert
            </a>
            <a className="nav-link" href="#/how-it-works">
              How it works
            </a>
          </nav>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            )}
          </button>
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
        <p className="footer-sub">Nothing is uploaded. No accounts, no cookies.</p>
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
