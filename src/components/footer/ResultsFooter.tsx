'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useLocation } from '../../hooks/useLocation'

/**
 * ResultsFooter — Refined footer for the search results page
 * Features: Location greeting, keyboard shortcuts, navigation, ambient design
 */
export default function ResultsFooter() {
  const { location, timeOfDay } = useLocation()

  return (
    <footer className="w-full mt-20 relative">
      {/* Top gradient divider */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-foreground/8 to-transparent" />

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 pb-12 pt-10 sm:px-6">
        
        {/* Location greeting with decorative elements */}
        {timeOfDay && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-3"
          >
            {/* Decorative dot cluster */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1 h-1 rounded-full bg-foreground/8" />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/12" />
              <span className="w-1 h-1 rounded-full bg-foreground/8" />
            </div>

            <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground/35 sm:text-[11px] sm:tracking-[0.5em]">
              Good {timeOfDay}
            </span>
            <span className="text-center text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/20 sm:tracking-[0.25em]">
              Connecting from {location}
            </span>
          </motion.div>
        )}

        {/* Keyboard shortcuts hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-3 text-[8px] text-center text-muted-foreground/20 sm:gap-4 sm:text-[9px]"
        >
          <div className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center justify-center w-5 h-5 text-[9px] font-medium rounded border border-foreground/[0.06] bg-foreground/[0.02] text-muted-foreground/30">/</kbd>
            <span>Focus search</span>
          </div>
          <span className="w-[3px] h-[3px] rounded-full bg-foreground/6" />
          <div className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center justify-center px-1.5 h-5 text-[9px] font-medium rounded border border-foreground/[0.06] bg-foreground/[0.02] text-muted-foreground/30">Esc</kbd>
            <span>Dismiss</span>
          </div>
          <span className="w-[3px] h-[3px] rounded-full bg-foreground/6" />
          <div className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center justify-center px-1.5 h-5 text-[9px] font-medium rounded border border-foreground/[0.06] bg-foreground/[0.02] text-muted-foreground/30">Tab</kbd>
            <span>Autocomplete</span>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-foreground/6 to-transparent" />

        {/* Logo + nav row */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="SeekEngine"
              width={16}
              height={16}
              className="opacity-25 group-hover:opacity-50 transition-opacity duration-300"
            />
            <span className="font-display text-xs tracking-tight text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors duration-300">
              SeekEngine
            </span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-6">
            {[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Terms', href: '/tos' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Developer', href: 'https://archduke.is-a.dev', external: true },
              { label: 'Source', href: 'https://github.com/archduke1337/SeekEngine', external: true },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/20 transition-all duration-300 hover:text-foreground/50 hover:tracking-[0.14em] sm:tracking-[0.12em] sm:hover:tracking-[0.18em]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-center text-[8px] uppercase tracking-[0.22em] text-muted-foreground/12 sm:tracking-[0.3em]">
            Sensed synthesis of human intent
          </p>
          <p className="text-center text-[9px] uppercase tracking-[0.12em] text-muted-foreground/18 sm:tracking-[0.15em]">
            &copy; {new Date().getFullYear()} SeekEngine &middot; All rights reserved
          </p>
        </div>
      </div>
    </footer>
  )
}
