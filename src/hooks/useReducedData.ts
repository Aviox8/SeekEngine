'use client'

import { useEffect, useState } from 'react'

/**
 * useReducedData — Respects the user's `prefers-reduced-data` preference
 * (Safari only today, but the spec is stable and Chrome is rolling it out).
 * Use to skip non-essential network requests like third-party favicons.
 */
export function useReducedData(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return
    const mq = window.matchMedia('(prefers-reduced-data: reduce)')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
