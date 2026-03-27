'use client'

/**
 * Modern Lenis Smooth Scroll Provider
 * Uses the latest React-integrated Lenis for maximum performance
 * Optimized for high-refresh rate displays (120Hz+)
 */

import { ReactLenis } from 'lenis/react'
import { ReactNode } from 'react'

export default function LenisProvider({ children }: { children: ReactNode }) {
  const options = {
    duration: 1.4,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.5,
    infinite: false,
    lerp: 0.08,
    syncTouch: true,
  }

  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  )
}
