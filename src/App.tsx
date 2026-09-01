import { useEffect, useState } from 'react'
import { ConverterPage } from './components/ConverterPage'
import { HowItWorksPage } from './components/HowItWorks'
import { LandingPage } from './components/Landing'
import { LegalNoticePage, PrivacyPage, TermsPage } from './components/Legal'
import { UpgradeModal } from './components/UpgradeModal'
import { usePro } from './pro/usePro'

function App() {
  const { isPro } = usePro()
  const [route, setRoute] = useState(() => window.location.hash)
  const [showUpgrade, setShowUpgrade] = useState(false)

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

  return (
    <div className="page">
      <header className="header">
        <a className="brand" href="#/">
          <img className="brand-logo" src="/favicon.png?v=2" alt="FoldenLoom" width="28" height="28" />
          FoldenLoom
        </a>
        <div className="header-actions">
          <span className="badge">Private &amp; secure</span>
          {isPro ? (
              <span className="badge badge-pro">Pro</span>
            ) : (
              <button type="button" className="upgrade-link" onClick={() => setShowUpgrade(true)}>
                Upgrade
              </button>
            )}
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
        </nav>
      </footer>

      {showUpgrade && (
        <UpgradeModal onClose={() => setShowUpgrade(false)} onUnlocked={() => setShowUpgrade(false)} />
      )}
    </div>
  )
}

export default App
