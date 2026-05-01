'use client'

/**
 * Home Page — Creative B&W with atmospheric background
 * Inspired by cosmos.so, sanalabs.com, fiddle.digital
 * Features: Apple Intelligence animated gradient border around viewport
 */

import Hero from '../components/home/Hero'
import SearchBar from '../components/search/SearchBar'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-700 relative">

      {/* Subtle noise texture */}
      <div className="fixed inset-0 pointer-events-none z-50 noise" />

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-5 pb-20 sm:px-6 sm:pb-24">
        <Hero />
        
        {/* SEARCH INTERFACE — pulled closer to hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 w-full max-w-[620px] sm:mt-8"
        >
          <SearchBar />
        </motion.div>

        {/* Footer tagline — readable, not invisible */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-12 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/40 sm:mt-16 sm:text-[11px] sm:tracking-[0.25em]"
        >
          Seek — Understand — Discover
        </motion.p>
      </div>
    </main>
  )
}
