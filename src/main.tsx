import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isDemo, installDemo } from './demo/demo'

// Demo data has to be seeded before the persisted stores are first imported.
if (isDemo) await installDemo()
const { default: App } = await import('./App.tsx')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
