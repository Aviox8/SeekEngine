'use client'

/**
 * ResultCard Component — Contrast Shader Card with Scroll Fade
 * Inspired by duna.com card system + Skiper UI Scroll Fade (skiper87)
 * Features: Contrast gradient shaders (dark-to-light / light-to-dark),
 * mouse tracking spotlight, smooth hover transitions
 */

import { SearchResult } from '../../lib/google-search'
import { motion } from 'framer-motion'
import { useState, useRef, useCallback, memo, useMemo } from 'react'

const SHADER_VARIANTS = [
  'shader-card',
  'shader-card-2',
  'shader-card-3',
]

const Favicon = memo(function Favicon({ url, fallback }: { url: string; fallback: string }) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  
  if (error) {
    // Better fallback: gradient background with letter
    const colors = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-emerald-500 to-cyan-500', 'from-orange-500 to-red-500']
    const colorIndex = fallback.charCodeAt(0) % colors.length
    return (
      <div className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[9px] shrink-0 bg-gradient-to-br ${colors[colorIndex]} text-white shadow-sm`}>
        {fallback}
      </div>
    )
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 w-5 h-5 rounded-md animate-pulse bg-foreground/10" />
      )}
      <img
        src={`https://www.google.com/s2/favicons?domain=${url}&sz=32`}
        alt=""
        width={20}
        height={20}
        className="w-5 h-5 rounded-md shrink-0"
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        loading="lazy"
      />
    </div>
  )
})

export default memo(function ResultCard({ result, index = 0 }: { result: SearchResult; index?: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  // PERF: Disabled expensive mouse position tracking to prevent state updates on every move
  // const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  
  // PERF: Memoize hostname extraction to avoid expensive URL parsing on every render
  // Previously: ~0.5ms per card × 10 cards = 5ms+ per results render
  const hostname = useMemo(() => {
    try { return new URL(result.link).hostname || result.displayLink || '' } 
    catch { return result.displayLink || '' }
  }, [result.link, result.displayLink])

  // PERF: Disabled mouse move tracking - causes re-renders on every move for multiple cards

  // PERF: Cycle through shader variants - simple modulo operation
  const shaderClass = SHADER_VARIANTS[index % SHADER_VARIANTS.length]

  return (
    <motion.a 
      ref={cardRef}
      href={result.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ 
        duration: 0.3, 
        delay: Math.min(index * 0.02, 0.2),
        ease: 'easeOut'
      }}
      whileHover={{ 
        y: -2, 
        scale: 1.01,
        transition: { duration: 0.15, ease: 'easeOut' } 
      }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased'
      }}
      className={`block p-5 rounded-xl group relative overflow-hidden transition-all duration-300 ${shaderClass}`}
    >
      {/* Mouse-tracking spotlight removed for performance - can be re-enabled if needed */}

      {/* Top accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-60 transition-opacity duration-300 bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />

       <div className="relative z-10 space-y-3">
          {/* Source */}
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60 group">
             <Favicon url={hostname} fallback={(result.source || result.displayLink || 'W').charAt(0).toUpperCase()} />
             <span className="truncate max-w-[240px] hover:text-muted-foreground/80 transition-colors" title={result.source || result.displayLink || hostname}>
               {result.source || result.displayLink || hostname}
             </span>
             <svg className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-50 transition-opacity shrink-0"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               aria-hidden="true">
               <path d="M7 17L17 7M17 7H7M17 7V17" />
             </svg>
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-semibold leading-snug text-foreground group-hover:text-foreground transition-colors duration-200 line-clamp-3">
             {result.title}
          </h3>

          {/* Snippet */}
          <p className="text-[13px] leading-[1.6] line-clamp-2 text-muted-foreground/70 group-hover:text-muted-foreground/80 transition-colors duration-200">
             {result.snippet}
          </p>
       </div>
    </motion.a>
    )
})

