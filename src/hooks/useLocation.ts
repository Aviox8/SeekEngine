'use client'

import { useEffect, useState, useRef } from 'react'

/**
 * useLocation — Shared hook for IP-based location and time-of-day detection.
 * Used by ResultsFooter (and formerly SiteLoader) to avoid duplicated logic.
 * 
 * PERF: Caches location in sessionStorage to avoid redundant API calls.
 * FIX: Uses mounted flag to prevent hydration mismatch for time-based content.
 */

const LOCATION_CACHE_KEY = 'seekengine-location-cache'

interface LocationCache {
  location: string
  timestamp: number
}

function getCachedLocation(): string | null {
  try {
    const raw = sessionStorage.getItem(LOCATION_CACHE_KEY)
    if (!raw) return null
    const cached: LocationCache = JSON.parse(raw)
    // Cache valid for 30 minutes
    if (Date.now() - cached.timestamp > 30 * 60 * 1000) return null
    return cached.location
  } catch {
    return null
  }
}

function setCachedLocation(location: string) {
  try {
    const cache: LocationCache = { location, timestamp: Date.now() }
    sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cache))
  } catch { /* quota exceeded or unavailable */ }
}

export function useLocation() {
  const [location, setLocation] = useState<string>('your world')
  const [locationError, setLocationError] = useState<string | null>(null)
  // FIX: Don't render time-based greeting until mounted to prevent hydration mismatch
  const [timeOfDay, setTimeOfDay] = useState<string>('')
  const fetchedRef = useRef(false)

  useEffect(() => {
    // Time of day — only set after mount
    const updateTime = () => {
      const hour = new Date().getHours()
      if (hour < 12) setTimeOfDay('morning')
      else if (hour < 18) setTimeOfDay('afternoon')
      else setTimeOfDay('evening')
    }

    updateTime()
    const timeInterval = setInterval(updateTime, 60_000)

    // PERF: Check cache first, then fall back to a fetch (async state updates only)
    let cancelled = false
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1200)

    ;(async () => {
      const cached = getCachedLocation()
      if (cached && !cancelled) {
        setLocation(cached)
        return
      }

      // Prevent double-fetch in strict mode
      if (fetchedRef.current) return
      fetchedRef.current = true

      try {
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
        if (!res.ok) throw new Error('Location fetch failed')
        const data = await res.json()
        if (controller.signal.aborted) return
        const loc = data.city || data.region
        if (loc) {
          setLocation(loc)
          setCachedLocation(loc)
        }
      } catch {
        // Expected if aborted or network error
        setLocationError('Location unavailable')
      } finally {
        clearTimeout(timeoutId)
      }
    })()

    return () => {
      clearInterval(timeInterval)
      clearTimeout(timeoutId)
      controller.abort()
      cancelled = true
    }
  }, [])

  return { location, timeOfDay, locationError }
}
