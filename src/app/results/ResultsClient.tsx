'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useMemo } from 'react'
import ResultCard from '../../components/search/ResultCard'
import SearchBar from '../../components/search/SearchBar'
import { ResultCardSkeleton } from '../../components/search/Skeleton'
import { SearchResult } from '../../lib/google-search'
import { StreamingAnswer } from '../../components/search/StreamingAnswer'
import { useSearchHistory } from '../../hooks/useSearchHistory'
import { motion, AnimatePresence } from 'framer-motion'
import LivingIcon from '../../components/shared/LivingIcon'
import ResultsFooter from '../../components/footer/ResultsFooter'

// CRITICAL FIX: Add response validation to prevent type errors from API changes
function validateSearchResponse(data: unknown): SearchResult[] {
  if (typeof data !== 'object' || !data) return []
  const response = data as Record<string, unknown>
  const results = response.results
  if (!Array.isArray(results)) return []
  return results.filter((r): r is SearchResult => {
    const item = r as { title?: unknown; snippet?: unknown; link?: unknown }
    return typeof r === 'object' && r !== null &&
      'title' in r && 'snippet' in r && 'link' in r &&
      typeof item.title === 'string' &&
      typeof item.snippet === 'string' &&
      typeof item.link === 'string'
  })
}

// Deduplicate results by link while preserving order
function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>()
  return results.filter(r => {
    if (seen.has(r.link)) return false
    seen.add(r.link)
    return true
  })
}

const TIME_OPTIONS = [
  { label: 'Any time', value: '' },
  { label: 'Past hour', value: 'h' },
  { label: 'Past day', value: 'd' },
  { label: 'Past week', value: 'w' },
  { label: 'Past month', value: 'm' },
  { label: 'Past year', value: 'y' },
] as const

export default function ResultsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  // Restore time filter from URL if present
  const urlTime = searchParams.get('time') || ''

  const [aiAnswer, setAiAnswer] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const [results, setResults] = useState<SearchResult[]>([])
  const [resultsLoading, setResultsLoading] = useState(true)
  const [resultsError, setResultsError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  const [followUpQuery, setFollowUpQuery] = useState('')
  const followUpInputRef = useRef<HTMLInputElement>(null)
  const searchAbortRef = useRef<AbortController | null>(null)
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shareResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { addEntry } = useSearchHistory()
  const [timeFilter, setTimeFilter] = useState(urlTime)

  useEffect(() => {
    setTimeFilter(urlTime)
  }, [urlTime])

  useEffect(() => {
    if (query) addEntry(query)
  }, [query, addEntry])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null
      const inEditable = !!active?.matches('input, textarea, select, [contenteditable="true"]')
      if (e.key === '/' && !inEditable) {
        e.preventDefault()
        followUpInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current)
      if (shareResetTimerRef.current) clearTimeout(shareResetTimerRef.current)
      searchAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!query) return

    setResultsLoading(true)
    setResultsError('')
    setResults([])
    setAiAnswer('')
    setFollowUpQuery('')
    setCopied(false)
    setShareCopied(false)
    if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current)
    if (shareResetTimerRef.current) clearTimeout(shareResetTimerRef.current)

    if (searchAbortRef.current) searchAbortRef.current.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller

    const fetchResults = async () => {
      try {
        const params = new URLSearchParams({ q: query })
        if (timeFilter) params.set('time', timeFilter)
        const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.')
          }
          if (response.status >= 500) {
            throw new Error('Search service is temporarily unavailable. Please try again shortly.')
          }
          throw new Error('Failed to fetch results')
        }
        const data = await response.json()
        
        // Validate response structure before using it
        const validatedResults = validateSearchResponse(data)
        // Deduplicate results by link
        const deduplicatedResults = deduplicateResults(validatedResults)
        if (!controller.signal.aborted) {
          setResults(deduplicatedResults)
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        const errorMsg = error instanceof Error ? error.message : ''
        const isFetchError = errorMsg.includes('Failed to fetch')
        console.error('Error fetching results:', error)
        if (!controller.signal.aborted) {
          setResultsError(
            isFetchError 
              ? 'Network error. Please check your connection and try again.'
              : errorMsg || 'Could not fetch search results. Please try again or refine your query.'
          )
        }
      } finally {
        if (!controller.signal.aborted) setResultsLoading(false)
      }
    }

    fetchResults()
    return () => { controller.abort() }
  }, [query, timeFilter, retryToken])

  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (!text.trim()) return false
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  const copyToClipboard = async () => {
    const ok = await copyTextToClipboard(aiAnswer)
    if (ok) {
      setCopied(true)
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current)
      copyResetTimerRef.current = setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareResults = async () => {
    const shareUrl = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SeekEngine: ${query}`,
          text: `Results for "${query}"`,
          url: shareUrl,
        })
        return
      } catch {
        // Fall through to copy-link fallback.
      }
    }

    const ok = await copyTextToClipboard(shareUrl)
    if (ok) {
      setShareCopied(true)
      if (shareResetTimerRef.current) clearTimeout(shareResetTimerRef.current)
      shareResetTimerRef.current = setTimeout(() => setShareCopied(false), 2000)
    }
  }

  const handleSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return

    const params = new URLSearchParams({ q: trimmedQuery })
    if (timeFilter) {
      params.set('time', timeFilter)
    }

    router.push(`/results?${params.toString()}`)
  }

  function handleFollowUp() {
    if (followUpQuery.trim()) handleSearch(followUpQuery)
  }

  if (!query) {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-24 bg-background">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-foreground">
            Query the <span className="font-display-italic text-muted-foreground/60">Machine</span>
          </h1>
          <SearchBar autoFocus />
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex w-full flex-1 flex-col bg-background pb-12 pt-16 sm:pb-16 sm:pt-20">

      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-[1] noise" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6">

        {/* Compact header — share + action buttons */}
        <header className="mb-3 flex items-center justify-end gap-2 py-2 sm:mb-5 sm:py-4">
          <button 
            type="button"
            onClick={shareResults}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 border border-foreground/[0.08] text-muted-foreground hover:text-foreground hover:border-foreground/15 hover:bg-foreground/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:px-3.5 sm:py-2 sm:rounded-xl sm:text-xs"
          >
            {shareCopied ? 'Link Copied' : 'Share'}
          </button>
        </header>

        {/* Query Title — fluid, responsive */}
        <div className="mb-6 animate-fade-in-up sm:mb-8 lg:mb-10">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-0.5 h-3.5 rounded-full bg-foreground/20 sm:h-4" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 sm:text-[10px] sm:tracking-[0.15em]">
              Results
            </span>
          </div>
          <h1 className="font-display break-words text-[clamp(1.5rem,5vw,3.5rem)] leading-[1.08] tracking-tight text-foreground">
            {query}
          </h1>
        </div>

        {/* Two-column layout — stacks on mobile */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
            
          {/* LEFT COLUMN: Synthesis */}
          <div className="w-full min-w-0 lg:w-[63%] animate-fade-in-up">
            <div className="relative overflow-hidden rounded-xl p-4 group border border-foreground/[0.06] bg-foreground/[0.01] sm:rounded-2xl sm:p-6 md:p-8">
               
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
               
              {/* Header: icon + title + copy */}
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-foreground/5 sm:gap-3 sm:mb-6 sm:pb-4">
                <LivingIcon color="#6F6F6F" size="w-2.5 h-2.5" />
                <h2 className="text-xs font-semibold tracking-wide text-foreground/70 sm:text-sm">
                  Synthesis
                </h2>
                <div className="ml-auto shrink-0">
                  <button 
                    type="button"
                    onClick={copyToClipboard}
                    disabled={!aiAnswer.trim()}
                    aria-label={copied ? 'Copied to clipboard' : 'Copy answer to clipboard'}
                    className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide transition-all px-2 py-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-accent/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:gap-1.5 sm:text-xs sm:px-2.5 sm:rounded-lg"
                  >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Streaming answer — responsive text sizing */}
              <StreamingAnswer 
                query={query} 
                timeRange={timeFilter || undefined}
                context={results}
                waitForContext
                contextReady={!resultsLoading}
                onComplete={setAiAnswer}
                onRegenerate={() => setAiAnswer('')}
                className="text-[15px] leading-relaxed sm:text-base"
              />

              {/* Follow-up */}
              <AnimatePresence>
                {aiAnswer && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-4 border-t border-foreground/5 sm:mt-8 sm:pt-6"
                  >
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground/60 mb-2 sm:text-xs sm:mb-3">
                      Follow-up Question
                    </label>
                    <div className="relative group">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors sm:left-4 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                      </svg>
                      <input 
                        ref={followUpInputRef}
                        type="text" 
                        value={followUpQuery}
                        onChange={(e) => setFollowUpQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFollowUp()
                          if (e.key === 'Escape') followUpInputRef.current?.blur()
                        }}
                        placeholder="Ask a follow-up…"
                        className="w-full rounded-lg py-2.5 pl-9 pr-12 text-sm font-medium transition-all outline-none bg-accent/5 border border-border/50 text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20 group-hover:border-border/80 sm:py-3 sm:pl-11 sm:pr-14"
                        style={{ caretColor: 'hsl(var(--primary))' }}
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:right-2">
                        <kbd className="hidden sm:inline-flex items-center justify-center px-2 py-1 text-[9px] font-semibold rounded border border-border/50 text-muted-foreground/40 bg-muted/30">/</kbd>
                        <button 
                          type="button"
                          onClick={handleFollowUp}
                          disabled={!followUpQuery.trim()}
                          aria-label="Submit follow-up question"
                          className="p-1.5 rounded-md transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:brightness-110 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:p-2 sm:rounded-lg sm:shadow-md"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN: Web Sources */}
          <div className="w-full min-w-0 lg:w-[37%] animate-fade-in-up animate-delay-100">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3 text-muted-foreground/40 sm:text-[11px] sm:tracking-[0.2em] sm:mb-4">
              Web Sources
            </h3>

            {/* Time Filter — horizontal scroll on mobile, wrap on desktop */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1 sm:flex-wrap sm:mb-5 sm:overflow-x-visible sm:mx-0 sm:px-0 sm:pb-0">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTimeFilter(opt.value)
                    // Update URL with time filter for bookmarking
                    const params = new URLSearchParams(searchParams.toString())
                    if (opt.value) {
                      params.set('time', opt.value)
                    } else {
                      params.delete('time')
                    }
                    router.push(`/results?${params.toString()}`, { scroll: false })
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border whitespace-nowrap ${
                    timeFilter === opt.value
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-foreground/[0.06] text-muted-foreground hover:border-foreground/15 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
             
            {/* Results list — scrollable on large screens */}
            <div className="space-y-2.5 sm:space-y-3 lg:max-h-[70vh] lg:overflow-y-auto lg:scroll-fade-y lg:pr-1">
              {resultsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <ResultCardSkeleton key={i} />)
              ) : resultsError ? (
                <div className="p-4 text-center rounded-xl border border-dashed border-destructive/30 sm:p-6">
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <svg className="w-6 h-6 text-destructive/50 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0-10a8 8 0 100 16 8 8 0 000-16z" />
                    </svg>
                  </div>
                  <p className="text-xs text-destructive font-medium mb-1 sm:text-sm">{resultsError}</p>
                  <p className="text-[10px] text-muted-foreground/60 mb-3 sm:text-xs sm:mb-4">Try a different query or check your connection.</p>
                  <button
                    type="button"
                    onClick={() => setRetryToken(t => t + 1)}
                    className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:text-xs"
                  >
                    Retry
                  </button>
                </div>
              ) : results.length > 0 ? (
                results.map((result, index) => (
                  <ResultCard key={result.link} result={result} index={index} />
                ))
              ) : (
                <div className="p-4 text-center rounded-xl border border-dashed border-foreground/10 sm:p-6">
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <svg className="w-6 h-6 text-muted-foreground/30 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 sm:text-sm sm:mb-2">No results found for {query}</p>
                  <p className="text-[10px] text-muted-foreground/60 sm:text-xs">Try rephrasing your query, check spelling, or try broader terms.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results page footer with location greeting */}
      <ResultsFooter />
    </main>
  )
}
