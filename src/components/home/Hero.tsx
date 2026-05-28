'use client'

/**
 * Hero Component — Apple-style clean, minimal hero
 * Inspired by apple.com: bold typography, generous whitespace, subtle animations
 */

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="w-full flex flex-col items-center justify-center relative overflow-visible pointer-events-none py-8 sm:py-12">
      
      {/* HERO CONTENT */}
      <motion.div
        className="relative z-10 text-center px-4 pointer-events-auto flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-6 sm:mb-8"
        >
          <Image
            src="/logo.png"
            alt="SeekEngine"
            width={56}
            height={56}
            className="w-14 h-14 sm:w-16 sm:h-16"
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

        {/* Subtle divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-12 h-px bg-foreground/10 mt-6 origin-center sm:w-16"
        />
      </motion.div>

      {/* TAGLINE — Clean, minimal */}
      <motion.div
        className="mt-6 md:mt-8 text-center space-y-2 z-20 relative max-w-md px-6 pointer-events-auto"
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="text-[14px] sm:text-[16px] text-foreground/50 tracking-[-0.01em] leading-relaxed font-light"
        >
          The future of discovery is not a list of links.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-[14px] sm:text-[16px] tracking-[-0.01em] leading-relaxed font-light"
        >
          It is a{' '}
          <span className="font-display-italic text-foreground">sensed synthesis</span>
          {' '}
          <span className="text-foreground/50">of human intent.</span>
        </motion.p>
      </motion.div>
    </section>
  )
}
