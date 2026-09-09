import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (window.top && window.top !== window.self) {
  document.documentElement.style.display = 'none'
  try {
    window.top.location.replace(window.self.location.href)
  } catch {
    window.stop()
  }
}

try {
  if (localStorage.getItem('theme') === 'light') {
    document.documentElement.dataset.theme = 'light'
  }
} catch {
  /* storage unavailable — keep default dark theme */
}

try {
  const params = new URLSearchParams(window.location.search)
  if (params.get('analytics') === 'off') localStorage.setItem('analyticsOptOut', '1')
  else if (params.get('analytics') === 'on') localStorage.removeItem('analyticsOptOut')

  const host = window.location.hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  if (!isLocal && localStorage.getItem('analyticsOptOut') !== '1') {
    const beacon = document.createElement('script')
    beacon.type = 'module'
    beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js'
    beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: '61cf156cee1f491696f96889ce44e32b' }))
    document.head.appendChild(beacon)
  }
} catch {
  /* storage unavailable — don't load the beacon */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
