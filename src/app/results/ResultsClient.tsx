'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import ResultCard from '../../components/search/ResultCard'
import SearchBar from '../../components/search/SearchBar'
import { ResultCardSkeleton } from '../../components/search/Skeleton'
import type { SearchResult } from '../../lib/google-search'
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
  const [groundedQuery, setGroundedQuery] = useState(query)
  const followUpInputRef = useRef<HTMLInputElement>(null)
  const aiCardRef = useRef<HTMLDivElement>(null)
  const searchAbortRef = useRef<AbortController | null>(null)
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shareResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { addEntry } = useSearchHistory()
  // Derived from the URL param; a local override only exists for in-flight user picks
  const [timeOverride, setTimeOverride] = useState<string | null>(null)
  const timeFilter = timeOverride ?? urlTime

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

    // Reset-on-query is intentional: a new query starts a fresh search state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResultsLoading(true)
    setResultsError('')
    setResults([])
    setAiAnswer('')
    setFollowUpQuery('')
    setGroundedQuery(query)
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

  // Stream must not start from an empty grounding set: if the search layer
  // errored out or matched nothing, an answer would be pure invention.
  const answerBlocked = !resultsLoading && (resultsError !== '' || results.length === 0)

  const runFollowUp = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || answerBlocked) return
    setFollowUpQuery('')
    addEntry(trimmed)
    setAiAnswer('')
    setGroundedQuery(trimmed)
    aiCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

  function handleFollowUp() {
    runFollowUp(followUpQuery)
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

      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 sm:px-6">

        {/* Compact header — share + action buttons */}
        <header className="mb-3 flex items-center justify-end gap-2 py-2 sm:mb-5 sm:py-4">
          <button
            type="button"
            onClick={shareResults}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-[color,background-color,transform] active:scale-95 bg-foreground/[0.04] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:px-3.5 sm:py-2 sm:rounded-xl sm:text-xs"
          >
            {shareCopied ? 'Link Copied' : 'Share'}
          </button>
        </header>

        {/* Query Title — fluid, responsive */}
        <div className="mb-6 animate-fade-in-up sm:mb-8 lg:mb-10">
          <h1 className="font-display break-words text-[clamp(1.5rem,5vw,3.5rem)] leading-[1.08] tracking-tight text-foreground">
            {groundedQuery}
          </h1>
        </div>

        {/* Two-column layout — stacks on mobile, synthesis sticky on desktop */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
            
          {/* LEFT COLUMN: Synthesis — sticky on desktop */}
          <div ref={aiCardRef} className="w-full min-w-0 lg:w-[63%] animate-fade-in-up lg:sticky lg:top-24 lg:self-start scroll-mt-24">
            <div className="relative overflow-hidden rounded-xl p-4 group bg-foreground/[0.02] sm:rounded-2xl sm:p-5 md:p-6">
               
              {/* Top accent line with gradient */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
               
              {/* Header: icon + title + copy */}
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-foreground/5 sm:gap-3 sm:mb-6 sm:pb-4">
                <LivingIcon size="w-2.5 h-2.5" />
                <h2 className="text-xs font-semibold tracking-wide text-foreground/70 sm:text-sm">
                  Synthesis
                </h2>
                <div className="ml-auto shrink-0">
                  <button 
                    type="button"
                    onClick={copyToClipboard}
                    disabled={!aiAnswer.trim()}
                    aria-label={copied ? 'Copied to clipboard' : 'Copy answer to clipboard'}
                    className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold transition-[color,background-color,transform] px-2 py-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-accent/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:gap-1.5 sm:px-2.5 sm:rounded-lg"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Streaming answer — responsive text sizing */}
              {answerBlocked ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center sm:py-12">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
                    <svg className="h-5 w-5 text-destructive/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4v2m0-10a8 8 0 100 16 8 8 0 000-16z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">No grounded answer possible</p>
                    <p className="mx-auto max-w-sm text-[11px] leading-relaxed text-muted-foreground/70 sm:text-xs">
                      The search layer returned nothing for &ldquo;{query}&rdquo;, so there is no source to ground an answer on. Fix the search first — retrying reloads the web results.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRetryToken(t => t + 1)}
                    className="rounded-lg bg-foreground px-4 py-2 text-[11px] font-semibold text-background transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:text-xs"
                  >
                    Retry search
                  </button>
                </div>
              ) : (
                <StreamingAnswer
                  query={groundedQuery}
                  timeRange={timeFilter || undefined}
                  context={results}
                  waitForContext
                  contextReady={!resultsLoading}
                  onComplete={setAiAnswer}
                  onRegenerate={() => setAiAnswer('')}
                  className="text-[15px] leading-relaxed sm:text-base"
                />
              )}

              {/* Suggestion chips — show when answer is complete */}
              <AnimatePresence>
                {aiAnswer && !followUpQuery && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-foreground/5 sm:mt-6 sm:pt-5"
                  >
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Tell me more about this',
                        'What are the alternatives?',
                        'How does this compare?',
                      ].map((suggestion) => (
                        <motion.button
                          key={suggestion}
                          type="button"
                          onClick={() => runFollowUp(suggestion)}
                          className="px-3 py-1.5 text-[11px] font-medium rounded-full bg-foreground/[0.04] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.07] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:text-xs"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Follow-up input */}
              <AnimatePresence>
                {aiAnswer && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-foreground/5 sm:mt-6 sm:pt-5"
                  >
                    <label htmlFor="follow-up-question" className="block text-[10px] sm:text-xs font-semibold text-muted-foreground/60 mb-2 sm:text-sm sm:mb-3">
                      Follow-up question
                    </label>
                    <div className="relative group">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors sm:left-4 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                      </svg>
                      <input
                        ref={followUpInputRef}
                        id="follow-up-question"
                        type="text"
                        value={followUpQuery}
                        onChange={(e) => setFollowUpQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFollowUp()
                          if (e.key === 'Escape') followUpInputRef.current?.blur()
                        }}
                        placeholder="Ask a follow-up…"
                        className="w-full rounded-lg py-2.5 pl-9 pr-12 text-base sm:text-sm font-medium transition-[color,background-color,box-shadow] outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 bg-accent/5 text-foreground placeholder:text-muted-foreground/40 focus:bg-accent/10 focus:ring-2 focus:ring-foreground/15 group-hover:bg-accent/10 sm:py-3 sm:pl-11 sm:pr-14"
                        style={{ caretColor: 'hsl(var(--primary))' }}
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:right-2">
                        <kbd className="hidden sm:inline-flex items-center justify-center px-2 py-1 text-[10px] sm:text-[11px] font-semibold rounded bg-foreground/[0.04] text-muted-foreground/40 bg-muted/30">/</kbd>
                        <motion.button 
                          type="button"
                          onClick={handleFollowUp}
                          disabled={!followUpQuery.trim()}
                          aria-label="Submit follow-up question"
                          className="p-1.5 rounded-md transition-[color,background-color,filter] disabled:opacity-30 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:brightness-110 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:p-2 sm:rounded-lg sm:shadow-md"
                          whileHover={{ scale: followUpQuery.trim() ? 1.05 : 1 }}
                          whileTap={{ scale: followUpQuery.trim() ? 0.95 : 1 }}
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN: Web Sources — sticky on desktop so it stays in view on long answers */}
          <div className="w-full min-w-0 lg:w-[37%] animate-fade-in-up animate-delay-100 lg:sticky lg:top-24 lg:self-start">
            <h3 className="mb-3 flex items-baseline gap-2 text-xs font-semibold tracking-wide text-foreground/70 sm:mb-4 sm:text-sm">
              Web Sources
              {!resultsLoading && results.length > 0 && (
                <span className="text-[10px] font-medium tabular-nums text-muted-foreground/50 sm:text-[11px]">{results.length}</span>
              )}
            </h3>

            {/* Time Filter — pill design with sliding indicator and fade edge */}
            <div className="relative">
              <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1 sm:flex-wrap sm:mb-5 sm:overflow-x-visible sm:mx-0 sm:px-0 sm:pb-0">
                {TIME_OPTIONS.map(opt => (
                  <motion.button
                    type="button"
                    key={opt.value}
                    onClick={() => {
                      setTimeOverride(opt.value)
                      // Update URL with time filter for bookmarking
                      const params = new URLSearchParams(searchParams.toString())
                      if (opt.value) {
                        params.set('time', opt.value)
                      } else {
                        params.delete('time')
                      }
                      router.push(`/results?${params.toString()}`, { scroll: false })
                    }}
                    aria-pressed={timeFilter === opt.value}
                    className={`relative shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-[color,background-color] duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 ${
                      timeFilter === opt.value
                        ? 'bg-foreground text-background shadow-sm'
                        : 'bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
              {/* Fade edge for mobile scroll */}
              <div className="absolute top-0 right-0 bottom-1 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" aria-hidden="true" />
            </div>
             
            {/* Results list — scrollable on large screens */}
            <div className="space-y-3 overscroll-contain lg:max-h-[72vh] lg:overflow-y-auto lg:scroll-fade-y lg:pr-1" data-lenis-prevent="true">
              {resultsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <ResultCardSkeleton key={i} />)
              ) : resultsError ? (
                <div className="p-4 text-center rounded-xl bg-destructive/[0.04] sm:p-6">
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-destructive/60 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0-10a8 8 0 100 16 8 8 0 000-16z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-destructive font-medium mb-1 sm:text-sm">{resultsError}</p>
                  <p className="text-[10px] text-muted-foreground/60 mb-3 sm:text-xs sm:mb-4">Try a different query or check your connection.</p>
                  <motion.button
                    type="button"
                    onClick={() => setRetryToken(t => t + 1)}
                    className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide rounded-lg bg-destructive/[0.06] text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:text-xs"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Retry
                  </motion.button>
                </div>
              ) : results.length > 0 ? (
                results.map((result, index) => (
                  <ResultCard key={result.link} result={result} index={index} />
                ))
              ) : (
                <div className="p-4 text-center rounded-xl bg-foreground/[0.03] sm:p-6">
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center">
                      <svg className="w-5 h-5 text-muted-foreground/30 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 sm:text-sm">No sources matched for &ldquo;{query}&rdquo;</p>
                  <p className="text-[10px] text-muted-foreground/60 mb-3 sm:text-xs sm:mb-4">Try a broader query, remove the time filter, or check spelling.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {timeFilter && (
                      <motion.button
                        type="button"
                        onClick={() => {
                          setTimeOverride('')
                          const params = new URLSearchParams(searchParams.toString())
                          params.delete('time')
                          router.push(`/results?${params.toString()}`, { scroll: false })
                        }}
                        className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-foreground/[0.04] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.07] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:text-[11px]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Any time
                      </motion.button>
                    )}
                    <motion.button
                      type="button"
                      onClick={() => setRetryToken(t => t + 1)}
                      className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-foreground/[0.04] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.07] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:text-[11px]"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Retry
                    </motion.button>
                  </div>
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
