'use client'

import { useEffect } from 'react'

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
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#fafafa',
          color: '#090909',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center', padding: '0 1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#555', marginBottom: '1.5rem' }}>
            A critical error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.5rem',
              border: '1px solid #090909',
              backgroundColor: '#090909',
              color: '#fafafa',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
