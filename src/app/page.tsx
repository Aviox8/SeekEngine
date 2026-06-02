'use client'

/**
 * Home Page — Apple-style clean, minimal landing
 * Inspired by apple.com: generous whitespace, refined typography
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Hero from '../components/home/Hero'
import SearchBar from '../components/search/SearchBar'
import { motion } from 'framer-motion'

const EXAMPLE_QUERIES = [
  'How does RAG reduce LLM hallucination?',
  'Compare Next.js 15 App Router vs Pages Router',
  'Latest developments in Web GPU 2026',
  'What is retrieval-augmented generation?',
]

export default function Home() {
  const router = useRouter()

  const runExample = useCallback((q: string) => {
    router.push(`/results?q=${encodeURIComponent(q)}`)
  }, [router])

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

        {/* Example queries — closes the "what is this?" gap for first-time visitors */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="mt-5 w-full max-w-[620px] flex flex-col items-center gap-2 sm:mt-6"
        >
          <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/30">
            Try a grounded search
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {EXAMPLE_QUERIES.map((q, i) => (
              <motion.button
                key={q}
                type="button"
                onClick={() => runExample(q)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.06, duration: 0.4 }}
                whileTap={{ scale: 0.97 }}
                className="px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border border-foreground/[0.06] bg-foreground/[0.01] text-foreground/55 transition-all hover:border-foreground/15 hover:text-foreground hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              >
                {q}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Footer tagline — subtle, refined */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
          className="mt-10 text-[11px] font-medium text-foreground/25 tracking-wide sm:mt-12 sm:text-xs"
        >
          Seek — Understand — Discover
        </motion.p>
      </div>
    </main>
  )
}
