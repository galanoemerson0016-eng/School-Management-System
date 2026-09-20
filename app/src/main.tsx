import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
;(window as unknown as Record<string, unknown>).Buffer = Buffer
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { clearTestSections } from './utils/testSectionGenerator'
import { db } from './services/database'

// Expose emergency cleanup & reset utilities on window for quick browser console recovery in dev
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).clearTestRecords = async () => {
    console.log('[FormEase Pro] Purging test sections, students, and assessment records...')
    const res = await clearTestSections()
    console.log('[FormEase Pro] Cleared test data successfully:', res)
    return res
  }
  ;(window as unknown as Record<string, unknown>).resetDatabase = async () => {
    if (window.confirm('Are you sure you want to completely reset and clear the local database? All stored records will be wiped.')) {
      console.log('[FormEase Pro] Resetting database...')
      await db.nukeDatabase()
      console.log('[FormEase Pro] Database reset. Reloading page...')
      window.location.reload()
    }
  }
}

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
