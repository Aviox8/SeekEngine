'use client'

/**
 * Page Transition Component
 * Adds smooth fade and slide animations to page changes.
 * Optimized for cinematic motion with accessibility-first fallbacks.
 */

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { usePathname, useSearchParams } from 'next/navigation'
import { ReactNode, Suspense } from 'react'

function TransitionInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const prefersReducedMotion = useReducedMotion()

  // Generate a key that accounts for search params for more robust route-change detection
  const key = pathname + searchParams.toString()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        role="main"
        aria-live="polite"
        initial={{ 
          opacity: 0, 
          y: prefersReducedMotion ? 0 : 8
        }}
        animate={{ 
          opacity: 1, 
          y: 0
        }}
        exit={{ 
          opacity: 0, 
          y: prefersReducedMotion ? 0 : -8
        }}
        transition={{
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <TransitionInner>{children}</TransitionInner>
    </Suspense>
  )
}
