'use client'

/**
 * Hero Component — Restrained B&W with Instrument Serif
 * Inspired by cosmos.so, fiddle.digital, sanalabs.com
 * Bold serif typography, atmospheric dot grid, contrast accents
 */

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="w-full flex flex-col items-center justify-center relative overflow-visible pointer-events-none py-4 sm:py-8">
      
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

      {/* HERO CONTENT */}
      <motion.div
        className="relative z-10 text-center px-4 pointer-events-auto flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 sm:mb-6"
        >
          <Image
            src="/logo.png"
            alt="SeekEngine"
            width={64}
            height={64}
            className="w-12 h-12 sm:w-16 sm:h-16"
            priority
          />
        </motion.div>

        {/* Title — Instrument Serif, fluid sizing */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[clamp(3rem,12vw,7rem)] leading-[0.9] tracking-[-0.03em] select-none text-foreground"
        >
          Seek<span className="font-display-italic text-muted-foreground/50">Engine</span>
        </motion.h1>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-[1px] bg-foreground/12 mt-5 origin-center sm:w-20"
        />
      </motion.div>

      {/* TAGLINE — improved readability */}
      <motion.div
        className="mt-5 md:mt-6 text-center space-y-1.5 z-20 relative max-w-lg px-6 pointer-events-auto"
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-[13px] sm:text-[15px] text-muted-foreground/70 tracking-[-0.01em] leading-relaxed"
        >
          The future of discovery is not a list of links.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="text-[13px] sm:text-[15px] tracking-[-0.01em] leading-relaxed"
        >
          It is a{' '}
          <span className="font-display-italic text-foreground">sensed synthesis</span>
          {' '}
          <span className="text-muted-foreground/70">of human intent.</span>
        </motion.p>
      </motion.div>
    </section>
  )
}
