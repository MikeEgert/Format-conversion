import { useEffect, useState } from 'react'
import { converters, groupConvertersByCategory } from './converters'
import { ConverterPage } from './components/ConverterPage'
import { HowItWorksPage } from './components/HowItWorks'
import { LandingPage } from './components/Landing'
import { LegalNoticePage, OpenSourcePage, PrivacyPage, TermsPage } from './components/Legal'
import { getLandingPage, getLandingPageByPath } from './seo/landingPages'

function ConvertersDropdown() {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`nav-dropdown${open ? ' is-open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <div
        className="nav-dropdown-trigger"
        tabIndex={0}
        role="button"
        aria-haspopup="true"
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span>Converters</span>
        <svg className="caret" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="nav-dropdown-menu" role="menu" aria-label="Converters">
        {groupConvertersByCategory(converters).map((group) => (
          <div className="nav-dropdown-group" key={group.category}>
            <span className="nav-dropdown-group-title">{group.category}</span>
            {group.converters.map((c) => {
              const landing = getLandingPage(c.id)
              return (
                <a
                  key={c.id}
                  className="nav-dropdown-item"
                  href={landing ? landing.path : `#/tool?converter=${c.id}`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <span className="ndi-from">{c.fromLabel}</span>
                  <svg className="ndi-arrow" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14m0 0-5-5m5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="ndi-to">{c.toLabel}</span>
                </a>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

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
  const landingPage = getLandingPageByPath(window.location.pathname)

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
            <ConvertersDropdown />
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
      ) : landingPage && route === '' ? (
        <ConverterPage />
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
