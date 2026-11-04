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
  const { history, removeEntry } = useSearchHistory()
  
  // PERF: Memoize dropdown style objects using CSS tokens
  const dropdownStyle = useMemo(() => ({
    background: 'var(--dropdown-surface)',
    backdropFilter: 'blur(40px)',
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
      {/* ── Search bar ── */}
      <div className="relative">

        {/* Main search bar — pill, no edges: ambient shadow only */}
        <div className={`relative z-[1] rounded-full px-5 py-2.5 bg-foreground/[0.02] transition-[background-color,box-shadow] duration-300 ${
          isFocused
            ? 'shadow-[0_8px_30px_rgba(0,0,0,0.10)]'
            : 'shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)]'
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
                <div className="absolute inset-0 flex items-baseline pointer-events-none text-[15px] sm:text-[16px] tracking-normal overflow-hidden whitespace-pre" aria-hidden="true">
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
                role="combobox"
                aria-autocomplete="list"
                aria-haspopup="listbox"
                aria-expanded={showSuggestionsList}
                aria-controls="search-suggestions-listbox"
                aria-activedescendant={selectedIndex >= 0 ? `search-suggestion-${selectedIndex}` : undefined}
                className="w-full bg-transparent border-none outline-none text-base font-normal tracking-normal text-foreground placeholder:text-muted-foreground/35 resize-none p-0 min-h-[44px] max-h-[160px] leading-normal"
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
            <AnimatePresence mode="wait">
              {query ? (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1 flex-shrink-0"
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
                    className="flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-150 text-muted-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                  
                  {/* Submit hint */}
                  <span className="text-[11px] text-muted-foreground/20 font-medium px-1" aria-hidden="true">↵</span>
                </motion.div>
              ) : isFocused ? (
                <motion.div
                  key="hints"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 flex-shrink-0"
                >
                  <kbd className="text-[10px] text-muted-foreground/20 font-medium px-1 py-0.5 rounded border border-foreground/[0.06] bg-foreground/[0.02]" aria-hidden="true">/</kbd>
                </motion.div>
              ) : null}
            </AnimatePresence>
        </div>

        {/* Idle keyboard hint — hidden once the user engages the input */}
        {!isTyping && !isFocused && (
          <div className="mt-4 hidden items-center justify-center gap-3 text-[11px] font-medium text-muted-foreground/40 sm:flex" aria-hidden="true">
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md border border-foreground/10 bg-foreground/[0.03] px-1.5 text-[10px] text-muted-foreground/50">/</kbd>
              to focus
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md border border-foreground/10 bg-foreground/[0.03] px-1.5 text-[10px] text-muted-foreground/50">↵</kbd>
              to search
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md border border-foreground/10 bg-foreground/[0.03] px-1.5 text-[10px] text-muted-foreground/50">Tab</kbd>
              to complete
            </span>
          </div>
        )}
      </div>

      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestionsList && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 z-40 overflow-hidden"
          >
            <div
              role="listbox"
               id="search-suggestions-listbox"
               aria-label="Search suggestions"
               className="rounded-2xl overflow-hidden"
               style={dropdownStyle}
            >
                <div className="px-4 py-2.5 border-b border-foreground/[0.05] flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-muted-foreground/30" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/30">suggestions</span>
                </div>
                {suggestions.slice(0, 10).map((suggestion, index) => (
                  <motion.div
                    key={`${suggestion}-${index}`}
                    id={`search-suggestion-${index}`}
                    role="option"
                    aria-selected={index === selectedIndex}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    onClick={() => {
                      updateQuery(suggestion)
                      handleSearch(suggestion)
                      setShowSuggestions(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`px-4 py-3 cursor-pointer flex items-center gap-3 text-[14px] font-medium transition-colors duration-150 ${
                      index === selectedIndex 
                        ? 'bg-primary/[0.06]' 
                        : 'hover:bg-foreground/[0.03]'
                    }`}
                  >
                    <Search className={`w-4 h-4 shrink-0 transition-colors duration-150 ${index === selectedIndex ? 'text-primary/60' : 'text-muted-foreground/30'}`} />
                    
                    <span className="text-foreground/80 truncate flex-1">
                      {suggestion.toLowerCase().startsWith(query.toLowerCase()) ? (
                        <>
                          <span className="text-foreground font-semibold">{query}</span>
                          <span className="text-foreground/40">{suggestion.slice(query.length)}</span>
                        </>
                      ) : (
                        suggestion
                      )}
                    </span>
                    
                    <motion.kbd
                      animate={{ opacity: index === selectedIndex ? 1 : 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] px-1.5 py-0.5 rounded-md border border-foreground/10 text-muted-foreground/40 bg-foreground/[0.02]"
                    >
                      ↵
                    </motion.kbd>
                  </motion.div>
                ))}
                
                <div className="px-4 py-2 border-t border-foreground/[0.05] flex justify-between items-center">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/30">{suggestions.length > 10 ? `${suggestions.length} results` : 'suggestions'}</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 text-[10px] rounded border border-foreground/10 text-muted-foreground/30 bg-foreground/[0.02]">↵</kbd>
                  </div>
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
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 z-40 overflow-hidden"
          >
             <div
               className="rounded-2xl overflow-hidden"
               style={dropdownStyle}
            >
                <div className="px-4 py-2.5 border-b border-foreground/[0.05] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/30" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/30">recent</span>
                </div>
                {history.slice(0, 8).map((entry, index) => (
                  <motion.div
                    key={entry.timestamp}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className="relative group"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        updateQuery(entry.query)
                        handleSearch(entry.query)
                        setShowSuggestions(false)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 min-h-[44px] text-left text-[14px] font-medium transition-colors duration-150 hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/20"
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors duration-150" aria-hidden="true" />
                      <span className="flex-1 truncate text-foreground/60 group-hover:text-foreground/80 transition-colors duration-150">{entry.query}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.query)}
                      aria-label={`Remove ${entry.query} from history`}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-2 rounded-md transition-[opacity,color,background-color] duration-150 text-muted-foreground/25 hover:text-destructive hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </motion.div>
                ))}
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
