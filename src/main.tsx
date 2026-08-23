import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ProProvider } from './pro/ProProvider.tsx'

if (window.top && window.top !== window.self) {
  document.documentElement.style.display = 'none'
  try {
    window.top.location.replace(window.self.location.href)
  } catch {
    window.stop()
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProProvider>
      <App />
    </ProProvider>
  </StrictMode>,
)
