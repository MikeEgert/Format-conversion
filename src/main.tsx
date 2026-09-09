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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
