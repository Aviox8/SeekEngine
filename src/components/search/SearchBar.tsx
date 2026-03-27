'use client'

/**
 * Search Bar — AI Chat Input with Mesh Gradient & Apple Intelligence Border
 * Features: Animated mesh gradient background, text shimmer effects,
 * perspective transforms, auto-resizing textarea, loading state transitions,
 * Apple Intelligence rotating gradient border on typing/focus
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearch } from '../../hooks/useSearch'
import { useSearchHistory } from '../../hooks/useSearchHistory'
import { useTheme } from 'next-themes'
import { Sparkles, ArrowRight, X, Search, Loader2 } from 'lucide-react'

export default function SearchBar({ 
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
  const { resolvedTheme } = useTheme()
  const { history, removeEntry } = useSearchHistory()
  const isDark = resolvedTheme === 'dark'
  
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

  // CRITICAL FIX: Empty dependency array prevents duplicate event listeners
  // Previously dependency on [isFocused] caused effect to re-run on every focus change
  // This created memory leak with accumulating listeners
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !textareaRef.current?.matches(':focus')) {
        e.preventDefault()
        textareaRef.current?.focus()
      }
      if (e.key === 'Escape') {
        textareaRef.current?.blur()
        setShowSuggestions(false)
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, []) // FIXED: Empty deps - runs once on mount

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
  useEffect(() => { setSelectedIndex(-1) }, [suggestions])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
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
      setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev)
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    } else if (e.key === 'Tab' && prediction && prediction !== query) {
      e.preventDefault()
      updateQuery(prediction)
    }
  }

  const ghostText = isTyping && prediction && prediction.toLowerCase().startsWith(query.toLowerCase())
    ? prediction.slice(query.length)
    : ''
  
  const showSuggestionsList = showSuggestions && !isCommand && suggestions.length > 0
  const showHistory = isFocused && !isTyping && !showSuggestionsList && history.length > 0

  return (
    <div className="relative w-full z-[100]" ref={suggestionsRef}>
      {/* Main search container */}
      <motion.div 
        layout
        className="relative z-50 group"
        initial={false}
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ perspective: '1200px' }}
      >
          {/* Mesh gradient background layer */}
          <div 
            className="relative overflow-hidden rounded-2xl transition-all duration-500"
            style={{
              background: isDark 
                ? 'rgba(10, 10, 10, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(40px) saturate(150%)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <div className="relative flex items-start">
              {/* Left icon area */}
              <div className="pl-4 pt-[15px] flex items-center justify-center relative z-10 shrink-0">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Loader2 className="w-[18px] h-[18px] text-foreground/40 animate-spin" />
                    </motion.div>
                  ) : isTyping ? (
                    <motion.div
                      key="sparkles"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sparkles className="w-[18px] h-[18px] text-foreground/40" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Search className={`w-[18px] h-[18px] transition-colors duration-300 ${isFocused ? 'text-foreground/50' : 'text-muted-foreground/30'}`} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Textarea with auto-resize */}
              <div className="relative flex-1 z-10 py-1">
                {/* Ghost text prediction */}
                {ghostText && (
                  <div className="absolute inset-0 flex items-start pointer-events-none text-[15px] tracking-tight overflow-hidden whitespace-pre px-3 py-[13px]">
                    <span className="opacity-0">{query}</span>
                    <span className="text-muted-foreground/15">{ghostText}</span>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => {
                    updateQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => {
                    setIsFocused(true)
                    if(suggestions.length > 0) setShowSuggestions(true)
                  }}
                  onBlur={(e) => {
                    const relatedTarget = e.relatedTarget as Node | null
                    if (relatedTarget && suggestionsRef.current?.contains(relatedTarget)) return
                    setTimeout(() => setIsFocused(false), 150)
                  }}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask anything…"
                  className="w-full bg-transparent border-none outline-none text-[15px] tracking-tight text-foreground placeholder:text-muted-foreground/25 resize-none px-3 py-[13px] min-h-[48px] max-h-[160px] leading-relaxed"
                  style={{ caretColor: 'hsl(var(--foreground))' }}
                  spellCheck={false}
                  autoComplete="off"
                  autoFocus={autoFocus}
                />
              </div>

              {/* Right action buttons */}
              <div className="pr-3 pt-[10px] flex items-center gap-1.5 relative z-10 shrink-0">
                {/* Keyboard hint */}
                <AnimatePresence>
                  {!isFocused && !query && (
                    <motion.kbd
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hidden sm:inline-flex items-center justify-center w-6 h-6 text-[11px] font-medium rounded-md border border-border/40 text-muted-foreground/25 bg-muted/20"
                    >
                      /
                    </motion.kbd>
                  )}
                </AnimatePresence>
                
                {/* Clear */}
                <AnimatePresence>
                  {query && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => {
                        updateQuery('')
                        textareaRef.current?.focus()
                      }}
                      className="p-1.5 rounded-lg transition-colors text-muted-foreground/30 hover:text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
                
                {/* Submit */}
                <AnimatePresence>
                  {query && (
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleSearch(query)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-foreground text-background transition-all"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Shimmer loading indicator at bottom */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-[2px] mx-4 mb-1 rounded-full origin-left overflow-hidden"
                >
                  <div 
                    className="h-full w-full rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.15), transparent)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </motion.div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestionsList && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 z-40 overflow-hidden"
          >
            <div className="rounded-xl overflow-hidden shadow-2xl border border-border/40 max-h-[60vh] overflow-y-auto"
              style={{
                background: isDark ? 'rgba(12, 12, 12, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(40px)',
              }}
            >
               {suggestions.map((suggestion, index) => (
                 <div
                   key={index}
                   onClick={() => {
                     updateQuery(suggestion)
                     handleSearch(suggestion)
                     setShowSuggestions(false)
                   }}
                   onMouseEnter={() => setSelectedIndex(index)}
                   className={`px-4 py-3 cursor-pointer flex items-center gap-3 text-[14px] transition-colors duration-100 ${index === selectedIndex ? 'bg-foreground/[0.04]' : 'hover:bg-foreground/[0.02]'}`}
                 >
                    <Search className={`w-3.5 h-3.5 shrink-0 ${index === selectedIndex ? 'text-foreground/40' : 'text-muted-foreground/20'}`} />
                    
                    <span className="text-foreground/70">
                      {suggestion.toLowerCase().startsWith(query.toLowerCase()) ? (
                        <>
                          <span className="text-foreground font-medium">{query}</span>
                          <span className="opacity-50">{suggestion.slice(query.length)}</span>
                        </>
                      ) : (
                        suggestion
                      )}
                    </span>
                 </div>
               ))}
               
               <div className="px-4 py-2 border-t border-border/20 flex justify-between items-center">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/25">suggestions</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] rounded border border-border/20 text-muted-foreground/25">enter</kbd>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search History Dropdown */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 z-40 overflow-hidden"
          >
            <div className="rounded-xl overflow-hidden shadow-2xl border border-border/40 max-h-[60vh] overflow-y-auto"
              style={{
                background: isDark ? 'rgba(12, 12, 12, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(40px)',
              }}
            >
              <div className="px-4 py-2 border-b border-border/20 flex justify-between items-center">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/25">recent searches</span>
              </div>
              {history.slice(0, 8).map((entry) => (
                <div
                  key={entry.timestamp}
                  className="px-4 py-3 cursor-pointer flex items-center gap-3 text-[14px] transition-colors group hover:bg-foreground/[0.03]"
                  onClick={() => {
                    updateQuery(entry.query)
                    handleSearch(entry.query)
                    setShowSuggestions(false)
                  }}
                >
                  <svg className="w-3.5 h-3.5 shrink-0 text-muted-foreground/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="flex-1 truncate text-foreground/60">{entry.query}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeEntry(entry.query)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all text-muted-foreground/30 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
