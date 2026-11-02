'use client'

/**
 * Hero Component — Apple Intelligence-style hero
 * Inspired by apple.com/apple-intelligence: aurora glow, clean typography
 */

import { motion } from 'framer-motion'
import Image from 'next/image'
import FluidOrb from './FluidOrb'

export default function Hero() {
  return (
    <section className="w-full flex flex-col items-center justify-center relative overflow-visible pointer-events-none py-8 sm:py-12">
      
      {/* Fluid orb behind logo */}
      <FluidOrb />

      {/* HERO CONTENT */}
      <motion.div
        className="relative z-10 text-center px-4 pointer-events-auto flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-6 sm:mb-8 relative"
        >
          {/* Subtle glow behind logo */}
          <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 blur-xl" />
          <Image
            src="/logo.png"
            alt="SeekEngine"
            width={56}
            height={56}
            className="w-14 h-14 sm:w-16 sm:h-16 relative z-10"
            priority
          />
        </motion.div>

        {/* Title — Apple-style large, clean typography */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="font-display text-[clamp(2.5rem,10vw,5.5rem)] leading-[0.92] tracking-[-0.03em] select-none text-foreground"
        >
          Seek<span className="font-display-italic text-foreground/30">Engine</span>
        </motion.h1>

        {/* Subtle divider line with gradient */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-16 h-px mt-6 origin-center sm:w-20"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.3), transparent)',
          }}
        />
      </motion.div>

      {/* TAGLINE — Aligned with the about page's "auditable, not magical" thesis */}
      <motion.div
        className="mt-6 md:mt-8 text-center space-y-2 z-20 relative max-w-md px-6 pointer-events-auto"
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="text-[14px] sm:text-[16px] text-foreground/55 tracking-[-0.01em] leading-relaxed font-light"
        >
          Search, then read what the model actually read.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-[14px] sm:text-[16px] tracking-[-0.01em] leading-relaxed font-light"
        >
          An{' '}
          <span className="font-display-italic text-foreground">auditable</span>
          {' '}
          <span className="text-foreground/55">answer with sources you can verify.</span>
        </motion.p>
      </motion.div>
    </section>
  )
}
