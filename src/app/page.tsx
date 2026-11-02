'use client'

/**
 * Home Page — Apple-style clean, minimal landing
 * Inspired by apple.com: generous whitespace, refined typography
 */

import { motion } from 'framer-motion'
import Hero from '../components/home/Hero'
import SearchBar from '../components/search/SearchBar'

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-700 relative">

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-5 pb-20 sm:px-6 sm:pb-24">
        <Hero />

        {/* SEARCH INTERFACE — pulled closer to hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-6 w-full max-w-[620px] sm:mt-8"
        >
          <SearchBar />
        </motion.div>
      </div>
    </main>
  )
}
