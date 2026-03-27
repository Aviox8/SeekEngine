'use client'

/**
 * Hero Component — Creative B&W with Instrument Serif
 * Inspired by cosmos.so, fiddle.digital, sanalabs.com
 * Bold serif typography, atmospheric dot grid, contrast accents
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

/* Floating abstract particles — monochrome (PERF: Reduced from 16 to 6 particles for better performance) */
function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      delay: Math.random() * 6,
      duration: Math.random() * 12 + 10,
    })), []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-foreground/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            willChange: 'transform, opacity',
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default function Hero() {
  // PERF: Removed useScroll/useTransform scroll listeners to prevent continuous re-renders
  // Static positioning uses less CPU than scroll-based animations
  
  return (
    <section className="w-full flex flex-col items-center justify-center relative overflow-visible pointer-events-none py-8 sm:py-12">
      
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
      
      {/* Floating particles */}
      <FloatingParticles />

      {/* HERO CONTENT */}
      <motion.div
        className="relative z-10 text-center px-4 pointer-events-auto flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 sm:mb-8"
        >
          <Image
            src="/logo.png"
            alt="SeekEngine"
            width={72}
            height={72}
            className="w-14 h-14 sm:w-[72px] sm:h-[72px]"
            priority
          />
        </motion.div>

        {/* Title — Instrument Serif */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[14vw] sm:text-[9vw] md:text-[7.5vw] leading-[0.88] tracking-[-0.03em] select-none text-foreground mix-blend-difference"
        >
          Seek<span className="font-display-italic text-muted-foreground/60">Engine</span>
        </motion.h1>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-24 h-[1px] bg-foreground/15 mt-6 origin-center"
        />
      </motion.div>

      {/* TAGLINE */}
      <motion.div
        className="mt-8 md:mt-10 text-center space-y-2 z-20 relative max-w-2xl px-6 pointer-events-auto"
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-sm md:text-base text-muted-foreground font-light tracking-tight"
        >
          The future of discovery is not a list of links.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-sm md:text-base tracking-tight"
        >
          It is a{' '}
          <span className="font-display-italic text-foreground">sensed synthesis</span>
          {' '}
          <span className="text-muted-foreground">of human intent.</span>
        </motion.p>
      </motion.div>
    </section>
  )
}
