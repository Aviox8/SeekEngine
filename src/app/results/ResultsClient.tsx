'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import ResultCard from '../../components/search/ResultCard'
import SearchBar from '../../components/search/SearchBar'
import { ResultCardSkeleton } from '../../components/search/Skeleton'
import { SearchResult } from '../../lib/google-search'
import { StreamingAnswer } from '../../components/search/StreamingAnswer'
import { useSearchHistory } from '../../hooks/useSearchHistory'
import { motion, AnimatePresence } from 'framer-motion'
import LivingIcon from '../../components/shared/LivingIcon'
import Link from 'next/link'
import Image from 'next/image'
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

  // PERF: Removed useScroll/useSpring scroll listeners to reduce continuous re-renders from scroll events
  // A simple CSS-based progress bar can be added instead if needed

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
      <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 bg-background">
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
    <main className="relative flex w-full flex-1 flex-col bg-background pb-16 pt-18 sm:pt-20">
      {/* PERF: Removed scroll progress indicator - was using useScroll/useSpring listeners */}

      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-[1] noise" />

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6">
        {/* Header Navigation — simplified, navbar handles branding */}
        <header className="mb-4 flex items-center justify-end gap-3 py-4 sm:mb-6">
             <div className="flex gap-2">
               <button 
                 onClick={shareResults}
                 className="px-3.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 border border-foreground/[0.08] text-muted-foreground hover:text-foreground hover:border-foreground/15 hover:bg-foreground/[0.02]"
               >
                 {shareCopied ? 'Link Copied' : 'Share'}
               </button>
             </div>
        </header>

        {/* Query Title — clean, confident */}
        <div className="mb-8 animate-fade-in-up sm:mb-10">
           <div className="flex items-center gap-2.5 mb-3">
             <div className="w-0.5 h-4 rounded-full bg-foreground/20" />
             <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
               Results
             </span>
           </div>
           <h1 className="font-display break-words text-[clamp(1.75rem,5vw,3.5rem)] leading-[1.05] tracking-tight text-foreground">
             {query}
           </h1>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            
            {/* LEFT COLUMN: Synthesis */}
            <div className="w-full lg:w-2/3 animate-fade-in-up">
              <div className="relative mb-8 overflow-hidden rounded-2xl p-5 group border border-foreground/[0.06] bg-foreground/[0.01] sm:p-6 md:p-8">
                 
                 {/* Top accent line */}
                 <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                 
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-foreground/5">
                    <LivingIcon color="#6F6F6F" size="w-2.5 h-2.5" />
                    <h2 className="text-sm font-semibold tracking-wide text-foreground/70">
                      Synthesis
                    </h2>
                    <div className="ml-auto flex items-center gap-2">
                      <button 
                        onClick={copyToClipboard}
                        disabled={!aiAnswer.trim()}
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition-all px-2.5 py-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-accent/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                           <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                           <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                         </svg>
                         {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                 </div>

                 <StreamingAnswer 
                    query={query} 
                    timeRange={timeFilter || undefined}
                    context={results}
                    waitForContext
                    contextReady={!resultsLoading}
                    onComplete={setAiAnswer}
                    onRegenerate={() => setAiAnswer('')}
                    className="text-[17px] leading-relaxed"
                 />

                 {/* Follow-up */}
                 <AnimatePresence>
                   {aiAnswer && (
                     <motion.div 
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       className="mt-8 pt-6 border-t border-foreground/5"
                     >
                        <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground/60 mb-3">
                          Follow-up Question
                        </label>
                        <div className="relative group">
                           <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
                              placeholder="Ask a follow-up question..."
                              className="w-full rounded-lg py-3 pl-11 pr-14 text-sm font-medium transition-all outline-none bg-accent/5 border border-border/50 text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20 group-hover:border-border/80"
                              style={{ caretColor: 'hsl(var(--primary))' }}
                           />
                           <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                             <kbd className="hidden sm:inline-flex items-center justify-center px-2 py-1 text-[9px] font-semibold rounded border border-border/50 text-muted-foreground/40 bg-muted/30">/</kbd>
                             <button 
                               onClick={handleFollowUp}
                               disabled={!followUpQuery.trim()}
                               className="p-2 rounded-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:brightness-110 shadow-md hover:shadow-lg"
                             >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            {/* RIGHT COLUMN: Web Sources with scroll fade */}
            <div className="w-full lg:w-1/3 animate-fade-in-up animate-delay-100">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 text-muted-foreground/40">
                  Web Sources
               </h3>

               {/* Time Filter */}
               <div className="flex flex-wrap gap-1.5 mb-5">
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
                     className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border ${
                       timeFilter === opt.value
                         ? 'bg-foreground text-background border-foreground'
                         : 'border-foreground/[0.06] text-muted-foreground hover:border-foreground/15 hover:text-foreground'
                     }`}
                   >
                     {opt.label}
                   </button>
                 ))}
               </div>
               
               {/* Results list — wrapped in scroll-fade-y container */}
               <div className="space-y-3 pr-1 lg:max-h-[70vh] lg:overflow-y-auto lg:scroll-fade-y">
                  {resultsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <ResultCardSkeleton key={i} />)
                  ) : resultsError ? (
                    <div className="p-6 text-center rounded-xl border border-dashed border-destructive/30">
                        <div className="flex justify-center mb-3">
                          <svg className="w-8 h-8 text-destructive/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2m0-10a8 8 0 100 16 8 8 0 000-16z" />
                          </svg>
                        </div>
                        <p className="text-sm text-destructive font-medium mb-1">{resultsError}</p>
                        <p className="text-xs text-muted-foreground/60 mb-4">Try a different query or check your connection.</p>
                        <button
                          onClick={() => setRetryToken(t => t + 1)}
                          className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Retry
                        </button>
                    </div>
                  ) : results.length > 0 ? (
                    results.map((result, index) => (
                      <ResultCard key={result.link} result={result} index={index} />
                    ))
                  ) : (
                    <div className="p-6 text-center rounded-xl border border-dashed border-foreground/10">
                        <div className="flex justify-center mb-3">
                          <svg className="w-8 h-8 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">No results found for {query}</p>
                        <p className="text-xs text-muted-foreground/60">Try rephrasing your query, check spelling, or try broader terms.</p>
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
