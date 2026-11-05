'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useLocation } from '../../hooks/useLocation'

/**
 * ResultsFooter — Restrained footer for the results page
 * Features: Location greeting, keyboard shortcuts, navigation
 */
export default function ResultsFooter() {
  const { location, timeOfDay } = useLocation()
  // FIX: Hydration-safe year — avoid mismatch if SSR timestamp crosses midnight
  const [year, setYear] = useState<number | null>(null)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setYear(new Date().getFullYear()) }, [])

  return (
    <footer className="w-full mt-16 sm:mt-20 relative">
      {/* Top gradient divider */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent" />

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-7 px-5 pb-10 pt-8 sm:px-6 sm:gap-8 sm:pb-12 sm:pt-10">
        
        {/* Location greeting */}
        {timeOfDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground/45 sm:tracking-[0.4em]">
              Good {timeOfDay}
            </span>
            <span className="text-center text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 sm:tracking-[0.2em]">
              Connecting from {location}
            </span>
          </motion.div>
        )}

        {/* Keyboard shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] sm:text-[11px] text-muted-foreground/50 sm:gap-5">
          <div className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center justify-center w-6 h-6 text-[10px] sm:text-[11px] font-medium rounded-md bg-foreground/[0.02] text-muted-foreground/30">/</kbd>
            <span>Focus follow-up</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center justify-center px-1.5 h-6 text-[10px] sm:text-[11px] font-medium rounded-md bg-foreground/[0.02] text-muted-foreground/30">Enter</kbd>
            <span>Send</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center justify-center px-1.5 h-6 text-[10px] sm:text-[11px] font-medium rounded-md bg-foreground/[0.02] text-muted-foreground/30">Tab</kbd>
            <span>Navigate</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-10 h-[1px] bg-foreground/[0.05]" />

        {/* Logo + nav */}
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
          <Link href="/" className="flex items-center gap-2 group touch-reset">
            <Image
              src="/logo.png"
              alt="SeekEngine"
              width={14}
              height={14}
              className="opacity-30 group-hover:opacity-60 group-focus-visible:opacity-60 transition-opacity duration-300"
            />
            <span className="font-display text-xs tracking-tight text-muted-foreground/40 group-hover:text-muted-foreground/60 group-focus-visible:text-muted-foreground/60 transition-colors duration-300">
              SeekEngine
            </span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:gap-5">
            {[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Docs', href: '/docs' },
              { label: 'API', href: '/api' },
              { label: 'Developer', href: '/developer' },
              { label: 'Terms', href: '/tos' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Legal', href: '/legal' },
              { label: 'Source', href: 'https://github.com/archduke1337/SeekEngine', external: true },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/50 transition-colors duration-200 hover:text-foreground/80 focus-visible:text-foreground/80"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-center text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-muted-foreground/45">
            &copy; {year ?? ''} SeekEngine &middot; All rights reserved
          </p>
        </div>
      </div>
    </footer>
  )
}
