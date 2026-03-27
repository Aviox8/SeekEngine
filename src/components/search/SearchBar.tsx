'use client'

/**
 * Search Bar — Premium AI Chat Input with Theme-Integrated Design
 * Features: Smooth focus animations, theme-aware gradients, enhanced visual hierarchy,
 * smooth transitions, integrated LivingIcon indicators, polished dropdown design
 */

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearch } from '../../hooks/useSearch'
import { useSearchHistory } from '../../hooks/useSearchHistory'
import { useTheme } from 'next-themes'
import { ArrowRight, X, Search, Loader2, Clock } from 'lucide-react'
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
  useEffect(() => { setSelectedIndex(-1) }, [suggestions])

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
  }, [query, selectedIndex, suggestions, prediction, handleSearch, updateQuery])

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
        className="relative z-50"
        initial={false}
        animate={isFocused ? { scale: 1.00 } : { scale: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Animated background gradient backdrop */}
        <motion.div
          className="absolute -inset-x-2 -bottom-2 opacity-0 pointer-events-none"
          animate={{ 
            opacity: isFocused ? 0.05 : 0,
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: `linear-gradient(90deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--primary) / 0.05) 50%, hsl(var(--primary) / 0.1) 100%)`,
            height: '1px'
          }}
        />

        {/* Main container - minimal, text-like appearance */}
        <div 
          className="relative overflow-hidden transition-all duration-300"
          style={{
            background: 'transparent',
            borderBottom: isFocused 
              ? `2px solid hsl(var(--primary) / 0.6)`
              : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          <div className="relative flex items-start min-h-[52px]">
            {/* Left icon area */}
            <div className="pl-0 pt-4 flex items-center justify-center relative z-10 shrink-0 pr-2">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Loader2 className="w-[18px] h-[18px] text-primary/60 animate-spin" />
                  </motion.div>
                ) : isTyping ? (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LivingIcon size="w-[18px] h-[18px]" color="#6F6F6F" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className={`w-[18px] h-[18px] transition-all duration-300 ${isFocused ? 'text-primary/60' : 'text-muted-foreground/40'}`} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Textarea with auto-resize */}
            <div className="relative flex-1 z-10">
              {/* Ghost text prediction */}
              {ghostText && (
                <div className="absolute inset-0 flex items-center pointer-events-none text-[15px] tracking-tight overflow-hidden whitespace-pre px-3 py-[16px]">
                  <span className="opacity-0">{query}</span>
                  <span className="text-muted-foreground/20">{ghostText}</span>
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
                aria-label="Search query input"
                aria-describedby="search-hint"
                aria-haspopup="listbox"
                aria-expanded={showSuggestionsList || showHistory}
                className="w-full bg-transparent border-none outline-none text-[16px] font-normal tracking-normal text-foreground placeholder:text-muted-foreground/35 resize-none px-0 py-4 min-h-[52px] max-h-[160px] leading-relaxed"
                style={{ caretColor: 'hsl(var(--primary))' }}
                spellCheck={false}
                autoComplete="off"
                autoFocus={autoFocus}
              />
            </div>

            {/* Right action buttons */}
            <div className="pr-0 pt-4 flex items-center gap-2 relative z-10 shrink-0">
              {/* Keyboard hint */}
              <AnimatePresence>
                {!isFocused && !query && (
                  <motion.kbd
                    id="search-hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hidden sm:inline-flex items-center justify-center w-6 h-6 text-[11px] font-semibold rounded-md border border-muted-foreground/15 text-muted-foreground/40 bg-muted/30 hover:bg-muted/50 transition-colors"
                    title="Press / to focus search"
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
                    className="p-1.5 rounded-lg transition-all text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/40"
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
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleSearch(query)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-primary-foreground transition-all shadow-lg hover:shadow-xl"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Loading indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0 }}
                transition={{ duration: 0.3 }}
                className="h-[1px] mx-4 mb-1 rounded-full origin-left overflow-hidden"
              >
                <div 
                  className="h-full w-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)',
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
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 z-40 overflow-hidden"
          >
            <div 
              role="listbox"
              className="rounded-xl overflow-hidden border transition-all"
              style={{
                background: isDark 
                  ? 'rgba(15, 15, 15, 0.98)'
                  : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(40px)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                boxShadow: isDark 
                  ? '0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : '0 16px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                maxHeight: '60vh',
                overflowY: 'auto'
              }}
            >
               {suggestions.slice(0, 10).map((suggestion, index) => (
                 <div
                   key={index}
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
              style={{
                background: isDark 
                  ? 'rgba(15, 15, 15, 0.98)'
                  : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(40px)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                boxShadow: isDark 
                  ? '0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : '0 16px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                maxHeight: '60vh',
                overflowY: 'auto'
              }}
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
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeEntry(entry.query)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5"
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
