'use client'

/**
 * Search Bar — Ultra-Minimal Text Input
 * Features: No visual form appearance, organic text input feeling, 
 * understated controls, living icon feedback, natural conversational interface
 */

import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearch } from '../../hooks/useSearch'
import { useSearchHistory } from '../../hooks/useSearchHistory'
import { useTheme } from 'next-themes'
import { X, Search, Loader2, Clock } from 'lucide-react'
import LivingIcon from '../shared/LivingIcon'

export default memo(function SearchBar({ 
  autoFocus = false, 
  onTyping,
}: { 
  autoFocus?: boolean, 
  onTyping?: (isTyping: boolean) => void,
}) {
  const { 
    query, 
    suggestions, 
    prediction, 
    isLoading, 
    updateQuery, 
    handleSearch,
  } = useSearch()
  
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { resolvedTheme } = useTheme()
  const { history, removeEntry } = useSearchHistory()
  const isDark = resolvedTheme === 'dark'
  
  // PERF: Memoize dropdown style objects using CSS tokens
  const dropdownStyle = useMemo(() => ({
    background: 'var(--dropdown-surface)',
    backdropFilter: 'blur(40px)',
    borderColor: 'var(--glass-border)',
    boxShadow: 'var(--dropdown-shadow)',
    maxHeight: '60vh',
    overflowY: 'auto' as const
  }), [])

  const [isFocused, setIsFocused] = useState(false)
  const isCommand = query.startsWith('/')
  const isTyping = query.length > 0

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '0px'
    const scrollH = textarea.scrollHeight
    textarea.style.height = Math.min(scrollH, 160) + 'px'
  }, [])

  useEffect(() => { resizeTextarea() }, [query, resizeTextarea])

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null
      const inEditable = !!active?.matches('input, textarea, select, [contenteditable="true"]')

      if (e.key === '/' && !textareaRef.current?.matches(':focus') && !inEditable) {
        e.preventDefault()
        textareaRef.current?.focus()
      }
      if (e.key === 'Escape' && textareaRef.current?.matches(':focus')) {
        textareaRef.current?.blur()
        setShowSuggestions(false)
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!showSuggestions) return
    function handleClickOutside(event: MouseEvent) {
      if (!suggestionsRef.current) return
      const target = event.target as Node
      const isInside = suggestionsRef.current.contains(target)
      const isInput = textareaRef.current?.contains(target)
      if (!isInside && !isInput) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSuggestions])

  useEffect(() => { onTyping?.(isTyping) }, [isTyping, onTyping])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!query.trim()) return
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSearch(suggestions[selectedIndex])
      } else {
        handleSearch(query)
      }
      setShowSuggestions(false)
    } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault()
      if (!showSuggestions) setShowSuggestions(true)
      setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev)
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault()
      if (!showSuggestions) setShowSuggestions(true)
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    } else if (e.key === 'Tab' && prediction && prediction !== query) {
      e.preventDefault()
      updateQuery(prediction)
    }
  }, [query, selectedIndex, suggestions, prediction, handleSearch, updateQuery, showSuggestions])

  const ghostText = isTyping && prediction && prediction.toLowerCase().startsWith(query.toLowerCase())
    ? prediction.slice(query.length)
    : ''
  
  const showSuggestionsList = showSuggestions && !isCommand && suggestions.length > 0
  const showHistory = isFocused && !isTyping && !showSuggestionsList && history.length > 0

  return (
    <div className="relative w-full z-[100]" ref={suggestionsRef}>
      {/* ── Apple Intelligence wrapper ── */}
      <div className="relative">

        {/* 1. Spinning rainbow ring border */}
        <div
          className={`absolute -inset-[2px] rounded-full transition-opacity duration-500 overflow-hidden pointer-events-none ${
            isTyping ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ zIndex: 0 }}
        >
          {/* Rotating gradient */}
          <div
            style={{
              position: 'absolute',
              inset: '-80%',
              background: 'conic-gradient(from var(--ai-angle, 0deg), #00c6fb, #7b2ff7, #ff2d78, #ff9500, #30d158, #00c6fb)',
              animation: isTyping ? 'ai-ring-spin 3s linear infinite' : 'none',
            }}
          />
          {/* Inner cutout — creates the border-only ring */}
          <div
            style={{
              position: 'absolute',
              inset: '2px',
              borderRadius: '9999px',
              background: 'var(--background)',
            }}
          />
        </div>

        {/* 2. Spotlight glow beneath bar */}
        <div
          className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full pointer-events-none transition-opacity duration-500 ${
            isTyping ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'conic-gradient(from var(--ai-angle, 0deg), #00c6fb33, #7b2ff733, #ff2d7833, #ff950033, #30d15833, #00c6fb33)',
            filter: 'blur(14px)',
            animation: isTyping ? 'ai-ring-spin 3s linear infinite' : 'none',
            zIndex: 0,
          }}
        />

        {/* 3. One-shot brush sweep on first keystroke */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              key="brush-sweep"
              className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
              style={{ zIndex: 10 }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.01, delay: 0.7 }}
            >
              <motion.div
                initial={{ left: '-100%', opacity: 0 }}
                animate={{ left: '120%', opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  position: 'absolute',
                  top: '-30%',
                  width: '60%',
                  height: '160%',
                  background: 'linear-gradient(105deg, transparent, rgba(0,198,251,0.35) 20%, rgba(123,47,247,0.45) 45%, rgba(255,45,120,0.4) 65%, rgba(255,149,0,0.25) 85%, transparent)',
                  filter: 'blur(4px)',
                  transform: 'skewX(-12deg)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Main search bar */}
        <div className={`relative z-[1] rounded-full px-5 py-2.5 border transition-all duration-300 ${
          isFocused 
            ? 'border-foreground/[0.12] bg-white/5 dark:bg-black/5 backdrop-blur-sm' 
            : 'border-foreground/[0.06] hover:border-foreground/[0.10] hover:bg-foreground/[0.02]'
        }`}>

          {/* Input wrapper */}
          <div className="relative flex items-baseline gap-1.5">
            {/* Living icon - appears while typing */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 mt-0.5"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-primary/60 animate-spin" />
                  ) : (
                    <LivingIcon size="w-4 h-4" color="#6F6F6F" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea - plain text input */}
            <div className="relative flex-1">
              {/* Ghost text prediction */}
              {ghostText && (
                <div className="absolute inset-0 flex items-baseline pointer-events-none text-[15px] sm:text-[16px] tracking-normal overflow-hidden whitespace-pre">
                  <span className="opacity-0">{query}</span>
                  <span className="text-muted-foreground/25">{ghostText}</span>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => {
                  updateQuery(e.target.value)
                  setShowSuggestions(e.target.value.trim().length > 0)
                  setSelectedIndex(-1)
                }}
                onFocus={() => {
                  setIsFocused(true)
                  if(suggestions.length > 0) setShowSuggestions(true)
                }}
                onBlur={(e) => {
                  const relatedTarget = e.relatedTarget as Node | null
                  if (relatedTarget && suggestionsRef.current?.contains(relatedTarget)) return
                  if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
                  blurTimeoutRef.current = setTimeout(() => setIsFocused(false), 150)
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Search anything…"
                aria-label="Search query input"
                aria-describedby="search-hint"
                aria-haspopup="listbox"
                className="w-full bg-transparent border-none outline-none text-[15px] sm:text-[16px] font-normal tracking-normal text-foreground placeholder:text-muted-foreground/35 resize-none p-0 min-h-[44px] max-h-[160px] leading-normal"
                style={{ caretColor: 'hsl(var(--primary))' }}
                spellCheck={false}
                autoComplete="off"
                autoFocus={autoFocus}
              />
              <p id="search-hint" className="sr-only">
                Press Enter to search. Press Shift and Enter for a new line. Press Tab to accept a suggestion.
              </p>
            </div>

            {/* Right controls - minimal and inline */}
            <AnimatePresence>
              {query && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-baseline gap-0.5 flex-shrink-0 flex-nowrap"
                >
                  {/* Clear button - subtle */}
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                      updateQuery('')
                      textareaRef.current?.focus()
                    }}
                    className="p-0.5 transition-opacity text-muted-foreground/40 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                  
                  {/* Submit hint - text only */}
                  <span className="text-xs text-muted-foreground/25 font-medium">↵</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 5. Siri-style animated bars (left side, outside input area) */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="absolute -left-12 top-1/2 -translate-y-1/2 z-[2] flex items-center gap-[3px] pointer-events-none"
            >
              {[
                { h: 8,  color: '#00c6fb', delay: '0s' },
                { h: 14, color: '#7b2ff7', delay: '0.15s' },
                { h: 10, color: '#ff2d78', delay: '0.3s' },
                { h: 16, color: '#ff9500', delay: '0.45s' },
                { h: 8,  color: '#30d158', delay: '0.6s' },
              ].map((bar, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: bar.h,
                    borderRadius: 2,
                    background: bar.color,
                    transformOrigin: 'bottom center',
                    animation: `ai-siri-wave 1.2s ease-in-out infinite ${bar.delay}`,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestionsList && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 z-40 overflow-hidden"
          >
            <div 
              role="listbox"
              className="rounded-xl overflow-hidden border transition-all"
              style={dropdownStyle}
            >
               {suggestions.slice(0, 10).map((suggestion, index) => (
                 <div
                   key={`${suggestion}-${index}`}
                   role="option"
                   aria-selected={index === selectedIndex}
                   onClick={() => {
                     updateQuery(suggestion)
                     handleSearch(suggestion)
                     setShowSuggestions(false)
                   }}
                   onMouseEnter={() => setSelectedIndex(index)}
                   className={`px-4 py-3.5 cursor-pointer flex items-center gap-3 text-[14px] font-medium transition-all duration-100 ${
                     index === selectedIndex 
                       ? 'bg-primary/8' 
                       : 'hover:bg-foreground/[0.03]'
                   }`}
                 >
                    <Search className={`w-4 h-4 shrink-0 transition-colors ${index === selectedIndex ? 'text-primary/60' : 'text-muted-foreground/30'}`} />
                    
                    <span className="text-foreground/80 truncate">
                      {suggestion.toLowerCase().startsWith(query.toLowerCase()) ? (
                        <>
                          <span className="text-foreground font-semibold">{query}</span>
                          <span className="text-foreground/50">{suggestion.slice(query.length)}</span>
                        </>
                      ) : (
                        suggestion
                      )}
                    </span>
                    
                    <motion.kbd
                      animate={{ opacity: index === selectedIndex ? 1 : 0 }}
                      className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary/60"
                    >
                      ↵
                    </motion.kbd>
                  </div>
               ))}
               
               <div className="px-4 py-2 border-t border-foreground/5 flex justify-between items-center bg-foreground/[0.01]">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">{suggestions.length > 10 ? `${suggestions.length} suggestions` : 'suggestions'}</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] rounded border border-foreground/10 text-muted-foreground/40 bg-muted/40">enter</kbd>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search History Dropdown */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 z-40 overflow-hidden"
          >
            <div 
              className="rounded-xl overflow-hidden border transition-all"
              style={dropdownStyle}
            >
              <div className="px-4 py-2.5 border-b border-foreground/5 flex items-center gap-2 bg-foreground/[0.01]">
                <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">recent</span>
              </div>
              {history.slice(0, 8).map((entry) => (
                <div
                  key={entry.timestamp}
                  className="px-4 py-3.5 cursor-pointer flex items-center gap-3 text-[14px] font-medium transition-all group hover:bg-foreground/[0.03]"
                  onClick={() => {
                    updateQuery(entry.query)
                    handleSearch(entry.query)
                    setShowSuggestions(false)
                  }}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/25 group-hover:text-muted-foreground/40 transition-colors" />
                  <span className="flex-1 truncate text-foreground/70 group-hover:text-foreground/90 transition-colors">{entry.query}</span>
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeEntry(entry.query)
                    }}
                    aria-label={`Remove ${entry.query} from history`}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 rounded transition-all text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </motion.button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
