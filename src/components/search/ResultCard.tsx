'use client'

/**
 * ResultCard Component — Clean, restrained source card
 * Features: Subtle border styling, proper mobile spacing,
 * smooth hover transitions, favicon with fallback
 */

import { SearchResult } from '../../lib/google-search'
import { motion } from 'framer-motion'
import { memo, useMemo } from 'react'

const Favicon = memo(function Favicon({ url, fallback }: { url: string; fallback: string }) {
  const faviconUrl = useMemo(() => `https://www.google.com/s2/favicons?domain=${url}&sz=32`, [url])
  
  return (
    <div className="relative w-5 h-5 shrink-0">
      <div
        className="absolute inset-0 rounded-md flex items-center justify-center text-[9px] font-bold bg-foreground/[0.06] text-foreground/50 pointer-events-none"
      >
        {fallback}
      </div>
      <img
        src={faviconUrl}
        alt=""
        width={20}
        height={20}
        className="absolute inset-0 w-5 h-5 rounded-md"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
})

export default memo(function ResultCard({ result, index = 0 }: { result: SearchResult; index?: number }) {
  const hostname = useMemo(() => {
    try { return new URL(result.link).hostname || result.displayLink || '' } 
    catch { return result.displayLink || '' }
  }, [result.link, result.displayLink])

  return (
    <motion.a 
      href={result.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ 
        duration: 0.25, 
        delay: Math.min(index * 0.03, 0.15),
        ease: 'easeOut'
      }}
      whileHover={{ y: -2, transition: { duration: 0.15, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98 }}
      className="block p-4 sm:p-5 rounded-xl group relative overflow-hidden transition-all duration-200 border border-foreground/[0.06] hover:border-foreground/[0.12] hover:bg-foreground/[0.02] hover:shadow-sm"
    >
       <div className="relative z-10 space-y-2.5">
          {/* Source */}
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/55">
             <Favicon url={hostname} fallback={(result.source || result.displayLink || 'W').charAt(0).toUpperCase()} />
             <span className="truncate max-w-[220px] sm:max-w-[240px]" title={result.source || result.displayLink || hostname}>
               {result.source || result.displayLink || hostname}
             </span>
             <svg className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-40 transition-opacity shrink-0"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               aria-hidden="true">
               <path d="M7 17L17 7M17 7H7M17 7V17" />
             </svg>
          </div>

          {/* Title */}
          <h3 className="text-[14px] sm:text-[15px] font-semibold leading-snug text-foreground/90 group-hover:text-foreground transition-colors duration-200 line-clamp-2">
             {result.title}
          </h3>

          {/* Snippet */}
          <p className="text-[13px] leading-[1.55] line-clamp-2 text-muted-foreground/60 group-hover:text-muted-foreground/70 transition-colors duration-200">
             {result.snippet}
          </p>
       </div>
    </motion.a>
    )
})
