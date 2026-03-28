'use client'

/**
 * Search Bar — Ultra-Minimal Text Input
 * Features: No visual form appearance, organic text input feeling, 
 * understated controls, living icon feedback, natural conversational interface
 */

import { useEffect, useRef, useState, useCallback, memo } from 'react'
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
      {/* Main search container - absolutely minimal */}
      <div className="relative z-50">
        {/* Focus underline indicator */}
        <motion.div
          className="absolute -bottom-1 left-0 right-0 h-[1px]"
          animate={{ 
            opacity: isFocused ? 1 : 0,
            scaleX: isFocused ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'hsl(var(--primary))',
            transformOrigin: 'left'
          }}
        />

        {/* Input wrapper - no visual styling */}
        <div className="relative flex items-baseline gap-1">
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
              <div className="absolute inset-0 flex items-baseline pointer-events-none text-[17px] tracking-normal overflow-hidden whitespace-pre">
                <span className="opacity-0">{query}</span>
                <span className="text-muted-foreground/20">{ghostText}</span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => {
                updateQuery(e.target.value)
                setShowSuggestions(e.target.value.trim().length > 0)
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
              placeholder="Ask anything…"
              aria-label="Search query input"
              aria-describedby="search-hint"
              aria-haspopup="listbox"
              aria-expanded={showSuggestionsList || showHistory}
              className="w-full bg-transparent border-none outline-none text-[17px] font-normal tracking-normal text-foreground placeholder:text-muted-foreground/30 resize-none p-0 min-h-[48px] max-h-[160px] leading-normal"
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
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    updateQuery('')
                    textareaRef.current?.focus()
                  }}
                  className="p-0.5 transition-opacity text-muted-foreground/40 hover:text-muted-foreground"
                  title="Clear"
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
                    aria-label={`Remove ${entry.query} from history`}
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
