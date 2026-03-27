import { useEffect, useState } from 'react'

/**
 * useLocation — Shared hook for IP-based location and time-of-day detection.
 * Used by LocationGreeting and ResultsFooter to avoid duplicated logic.
 */
export function useLocation() {
  const [location, setLocation] = useState<string>('your world')
  const [timeOfDay, setTimeOfDay] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours()
      if (hour < 12) setTimeOfDay('morning')
      else if (hour < 18) setTimeOfDay('afternoon')
      else setTimeOfDay('evening')
    }

    updateTime()
    const timeInterval = setInterval(updateTime, 60_000)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1200)

    // CRITICAL FIX: Use try-finally to guarantee timeout cleanup
    // Previously timer could leak if fetch promise never settled
    ;(async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
        if (!res.ok) throw new Error('Location fetch failed')
        const data = await res.json()
        if (controller.signal.aborted) return
        if (data.city) setLocation(data.city)
        else if (data.region) setLocation(data.region)
      } catch {
        // Expected if aborted or network error - silently fail
      } finally {
        // GUARANTEE: Timer always cleared regardless of fetch outcome
        clearTimeout(timeoutId)
      }
    })()

    return () => {
      clearInterval(timeInterval)
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  return { location, timeOfDay }
}
