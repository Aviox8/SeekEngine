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
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pb-16 sm:pb-20">
        <Hero />
        
        {/* SEARCH INTERFACE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 w-full max-w-[640px] px-1 sm:mt-10"
        >
          <SearchBar />
        </motion.div>

        {/* Footer tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2.5 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground/25 sm:mt-14 sm:gap-4 sm:tracking-[0.25em]"
        >
          <span>Seek</span>
          <span className="w-[3px] h-[3px] rounded-full bg-foreground/10" />
          <span>Understand</span>
          <span className="w-[3px] h-[3px] rounded-full bg-foreground/10" />
          <span>Discover</span>
        </motion.div>
      </div>
    </main>
  )
}
