'use client'

/**
 * ResultCard Component — Clean, restrained source card
 * Features: Subtle border styling, proper mobile spacing,
 * smooth hover transitions, favicon with fallback
 * Responsive: Tighter padding on mobile, fluid text sizes
 */

import type { SearchResult } from '../../lib/google-search'
import { motion, useReducedMotion } from 'framer-motion'
import { memo, useMemo } from 'react'
import Image from 'next/image'
import { useReducedData } from '../../hooks/useReducedData'

const Favicon = memo(function Favicon({ url, fallback }: { url: string; fallback: string }) {
  const reduceData = useReducedData()
  const faviconUrl = useMemo(() => `https://www.google.com/s2/favicons?domain=${url}&sz=32`, [url])

  return (
    <div className="relative w-4 h-4 shrink-0 sm:w-5 sm:h-5">
      <div
        className="absolute inset-0 rounded flex items-center justify-center text-[8px] font-bold bg-foreground/[0.08] text-foreground/60 pointer-events-none sm:rounded-md sm:text-[9px]"
      >
        {fallback}
      </div>
      {!reduceData && (
        <Image
          src={faviconUrl}
          alt=""
          width={20}
          height={20}
          className="absolute inset-0 w-full h-full rounded sm:rounded-md"
          unoptimized
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
    </div>
  )
})

export default memo(function ResultCard({ result, index = 0 }: { result: SearchResult; index?: number }) {
  const reduceMotion = useReducedMotion()
  const hostname = useMemo(() => {
    try { return new URL(result.link).hostname || result.displayLink || '' }
    catch { return result.displayLink || '' }
  }, [result.link, result.displayLink])

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
      className="block p-4 rounded-2xl group relative overflow-hidden border border-foreground/[0.04] transition-[border-color,background-color,box-shadow] duration-200 hover:border-foreground/[0.10] hover:bg-foreground/[0.02] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] focus-visible:border-foreground/[0.14] focus-visible:bg-foreground/[0.02] focus-visible:shadow-[0_4px_24px_rgba(0,0,0,0.08)] sm:p-5 md:p-6"
    >
       <div className="relative z-10 space-y-1.5 sm:space-y-2.5">
          {/* Source */}
          <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground/55 sm:gap-2 sm:text-[10px]">
             <Favicon url={hostname} fallback={(result.source || result.displayLink || 'W').charAt(0).toUpperCase()} />
             <span className="truncate max-w-[180px] sm:max-w-[240px]" title={result.source || result.displayLink || hostname}>
               {result.source || result.displayLink || hostname}
             </span>
              <svg className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-40 group-focus-visible:opacity-60 transition-opacity duration-200 shrink-0 sm:w-3.5 sm:h-3.5"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
          </div>

          {/* Title */}
          <h3 className="text-[13px] font-semibold leading-snug text-foreground/90 transition-colors duration-200 group-hover:text-foreground group-focus-visible:text-foreground line-clamp-2 sm:text-[14px] md:text-[15px]">
             {result.title}
          </h3>

          {/* Snippet */}
          <p className="text-[12px] leading-[1.5] line-clamp-2 text-muted-foreground/60 transition-colors duration-200 group-hover:text-muted-foreground/70 group-focus-visible:text-muted-foreground/70 sm:text-[13px] sm:leading-[1.55]">
             {result.snippet}
          </p>
       </div>
    </motion.a>
    )
})
