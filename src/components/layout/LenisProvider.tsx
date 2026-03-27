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
    duration: 0.8,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.7,
    touchMultiplier: 1.2,
    infinite: false,
    lerp: 0.04,
    syncTouch: true,
  }

  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  )
}
