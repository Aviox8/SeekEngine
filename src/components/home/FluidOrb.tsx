'use client'

/**
 * FluidOrb — organic animated ambient visual for the hero (RareUI-style pattern)
 * A soft, slowly morphing gradient blob that adds atmosphere without chrome.
 * Purely decorative; aria-hidden and pointer-events-none.
 */

import { motion } from 'framer-motion'

export default function FluidOrb() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] pointer-events-none"
      aria-hidden="true"
    >
      {/* Fluid blob — layered radial gradients in monochrome light */}
      <div
        className="absolute inset-0 rounded-full opacity-[0.10] dark:opacity-[0.16] blur-[90px] animate-[ai-rotate_14s_linear_infinite]"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, #a3a3a3 0%, transparent 55%), radial-gradient(circle at 70% 65%, #d4d4d4 0%, transparent 60%), radial-gradient(circle at 50% 90%, #737373 0%, transparent 55%)',
          filter: 'blur(60px)',
        }}
      />
      {/* Inner core glow */}
      <div
        className="absolute inset-8 sm:inset-12 rounded-full opacity-[0.5] blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(140, 140, 140, 0.28) 0%, rgba(140, 140, 140, 0.08) 55%, transparent 75%)',
        }}
      />
    </motion.div>
  )
}
