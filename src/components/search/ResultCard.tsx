'use client'

/**
 * ResultCard Component — Clean, restrained source card
 * Frameless card with ambient shadow, letter-glyph favicon fallback
 * (no third-party favicon service — nothing leaks the queried domain),
 * generous tap targets and visible focus feedback.
 */

import type { SearchResult } from '../../lib/google-search'
import { motion, useReducedMotion } from 'framer-motion'
import { memo, useMemo } from 'react'

function getHostname(url: string, displayLink?: string): string {
  try { return new URL(url).hostname || displayLink || '' }
  catch { return displayLink || '' }
}

function getInitial(result: SearchResult, hostname: string): string {
  const source = result.source || result.displayLink || hostname || 'W'
  return source.charAt(0).toUpperCase()
}

export default memo(function ResultCard({ result, index = 0, onOsintClick }: { result: SearchResult; index?: number; onOsintClick?: (hostname: string) => void }) {
  const reduceMotion = useReducedMotion()
  const hostname = useMemo(() => getHostname(result.link, result.displayLink), [result.link, result.displayLink])
  const initial = useMemo(() => getInitial(result, hostname), [result, hostname])

  return (
    <motion.a
      href={result.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{
        duration: 0.25,
        delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.15),
        ease: 'easeOut'
      }}
      whileHover={{ y: -2, transition: { duration: 0.15, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98 }}
      className="block p-5 rounded-2xl group relative overflow-hidden transition-[background-color,box-shadow] duration-200 hover:bg-foreground/[0.04] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] focus-visible:bg-foreground/[0.04] focus-visible:shadow-[0_4px_24px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:p-6"
    >
       <div className="relative z-10 space-y-2 sm:space-y-2.5">
          {/* Source */}
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 sm:gap-2 sm:text-[11px]">
             <div
               className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-foreground/[0.08] text-[9px] font-bold text-foreground/60 sm:h-5 sm:w-5 sm:rounded-md sm:text-[10px]"
               aria-hidden="true"
             >
               {initial}
             </div>
             <span className="truncate max-w-[180px] sm:max-w-[240px]" title={result.source || result.displayLink || hostname}>
               {result.source || result.displayLink || hostname}
             </span>
              <svg className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-40 group-focus-visible:opacity-60 transition-opacity duration-200 shrink-0 sm:w-4 sm:h-4"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
              {hostname && onOsintClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onOsintClick(hostname)
                  }}
                  aria-label={`OSINT lookup for ${hostname}`}
                  className="flex h-5 w-5 items-center justify-center rounded bg-foreground/[0.08] text-[9px] font-bold text-foreground/60 hover:bg-foreground/[0.12] transition-colors"
                >
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              )}
          </div>

          {/* Title */}
          <h3 className="text-[14px] font-semibold leading-snug text-foreground/90 transition-colors duration-200 group-hover:text-foreground group-focus-visible:text-foreground line-clamp-2 sm:text-[15px] md:text-base">
             {result.title}
          </h3>

          {/* Snippet */}
          <p className="text-[13px] leading-[1.55] line-clamp-2 text-muted-foreground/70 transition-colors duration-200 group-hover:text-muted-foreground/80 group-focus-visible:text-muted-foreground/80 sm:text-[13.5px] md:text-sm">
             {result.snippet}
          </p>
       </div>
    </motion.a>
  )
})
