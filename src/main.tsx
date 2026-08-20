import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ProProvider } from './pro/ProProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProProvider>
      <App />
    </ProProvider>
  </StrictMode>,
)
