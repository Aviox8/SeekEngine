'use client'

import { useEffect } from 'react'

const CRITICAL_ERROR_CSS = `
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #fafafa; color: #090909; font-family: system-ui, -apple-system, sans-serif; }
  .ge-panel { max-width: 28rem; text-align: center; padding: 0 1.5rem; }
  .ge-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
  .ge-body { font-size: 0.875rem; color: #555; margin: 0 0 1.5rem; }
  .ge-button { padding: 0.625rem 1.5rem; font-size: 0.875rem; font-weight: 500; border-radius: 0.5rem; background-color: #090909; color: #fafafa; cursor: pointer; }
  .ge-button:focus-visible { outline: 0.125rem solid #090909; outline-offset: 0.125rem; }
`

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_ERROR_CSS }} />
        <div className="ge-panel">
          <h1 className="ge-title">Something went wrong</h1>
          <p className="ge-body">A critical error occurred. Please try again.</p>
          <button type="button" onClick={reset} className="ge-button">
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
