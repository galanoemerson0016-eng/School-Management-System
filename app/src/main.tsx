import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
;(window as unknown as Record<string, unknown>).Buffer = Buffer
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

// Global error handlers: the ErrorBoundary only catches React render errors;
// these catch everything else (event handlers, async code, promise chains)
// and persist them to the main-process log file in the desktop build.
function reportGlobalError(kind: string, message: string, stack?: string) {
  console.error(`[${kind}]`, message, stack || '')
  try {
    window.electronAPI?.logError({ kind, message, stack })
  } catch {
    // logging must never throw
  }
}

window.addEventListener('error', (event) => {
  reportGlobalError('error', event.message || String(event.error), event.error?.stack)
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  reportGlobalError(
    'unhandledrejection',
    reason instanceof Error ? reason.message : String(reason),
    reason instanceof Error ? reason.stack : undefined
  )
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
