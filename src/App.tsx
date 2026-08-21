import { useEffect, useState } from 'react'
import { ConverterPage } from './components/ConverterPage'
import { LandingPage } from './components/Landing'

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

  return (
    <div className="page">
      <header className="header">
        <a className="brand" href="#/">
          <svg className="brand-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M8 13h8M8 16h5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Format Converter
        </a>
        <div className="header-actions">
          <span className="badge">Private &amp; secure</span>
        </div>
      </header>

      {isTool ? <ConverterPage /> : <LandingPage />}

      <footer className="footer">
        <p>Convert files privately, right in your browser.</p>
        <p className="footer-sub">Nothing is uploaded. No accounts, no tracking.</p>
      </footer>
    </div>
  )
}

export default App
