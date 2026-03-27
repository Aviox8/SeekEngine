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

  const [aiAnswer, setAiAnswer] = useState('')
  const [copied, setCopied] = useState(false)

  const [results, setResults] = useState<SearchResult[]>([])
  const [resultsLoading, setResultsLoading] = useState(true)
  const [resultsError, setResultsError] = useState('')

  const [followUpQuery, setFollowUpQuery] = useState('')
  const followUpInputRef = useRef<HTMLInputElement>(null)
  const searchAbortRef = useRef<AbortController | null>(null)
  const { addEntry } = useSearchHistory()
  const [timeFilter, setTimeFilter] = useState('')

  useEffect(() => {
    if (query) addEntry(query)
  }, [query, addEntry])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !document.activeElement?.matches('input, textarea')) {
        e.preventDefault()
        followUpInputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!query) return

    setResultsLoading(true)
    setResultsError('')
    setResults([])
    setAiAnswer('')
    setFollowUpQuery('')
    setCopied(false)

    if (searchAbortRef.current) searchAbortRef.current.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller

    const fetchResults = async () => {
      try {
        const params = new URLSearchParams({ q: query })
        if (timeFilter) params.set('time', timeFilter)
        const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Failed to fetch results')
        const data = await response.json()
        if (!controller.signal.aborted) setResults(data.results || [])
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error('Error fetching results:', error)
        if (!controller.signal.aborted) setResultsError('Could not fetch search results. Please try again.')
      } finally {
        if (!controller.signal.aborted) setResultsLoading(false)
      }
    }

    fetchResults()
    return () => { controller.abort() }
  }, [query, timeFilter])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiAnswer)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: `SeekEngine: ${query}`,
        text: `Results for "${query}"`,
        url: window.location.href,
      })
    } else {
      copyToClipboard()
    }
  }

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) router.push(`/results?q=${encodeURIComponent(searchQuery)}`)
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
    <main className="w-full flex-1 pt-24 pb-16 bg-background flex flex-col">
      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-[1] noise" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Header Navigation */}
        <header className="flex items-center justify-between py-6 mb-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image src="/logo.png" alt="SeekEngine" width={28} height={28} className="transition-transform group-hover:scale-90" />
              <span className="font-display text-xl tracking-tight text-foreground group-hover:opacity-70 transition-opacity">
                SeekEngine
              </span>
            </Link>

            <div className="flex gap-2 sm:gap-3">
               <button 
                 onClick={shareResults}
                 className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/5 hover:border-foreground/20"
               >
                 Share
               </button>
            </div>
        </header>

        {/* Query Title */}
        <div className="mb-12 animate-fade-in-up">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-1 h-5 rounded-full bg-primary/[0.4] dark:bg-primary/[0.3]" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
               Search Results
             </span>
           </div>
           <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight text-foreground break-words">
             {query}
           </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
            
            {/* LEFT COLUMN: Synthesis */}
            <div className="w-full lg:w-2/3 animate-fade-in-up">
              <div className="relative group p-6 md:p-8 rounded-xl overflow-hidden mb-10 shader-card">
                 
                 {/* Top accent line */}
                 <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                 
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-foreground/5">
                    <LivingIcon color="bg-primary/60" size="w-2.5 h-2.5" />
                    <h2 className="text-sm font-bold tracking-wide text-foreground/80">
                      AI Deep Analysis
                    </h2>
                    <div className="ml-auto flex items-center gap-2">
                      <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition-all px-2.5 py-1.5 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-accent/10 active:scale-95"
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
               <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-muted-foreground/40">
                  <LivingIcon color="bg-foreground/30" size="w-1.5 h-1.5" />
                  Web Sources
               </h3>

               {/* Time Filter */}
               <div className="flex flex-wrap gap-1.5 mb-5">
                 {TIME_OPTIONS.map(opt => (
                   <button
                     key={opt.value}
                     onClick={() => setTimeFilter(opt.value)}
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
               <div className="space-y-3 max-h-[70vh] overflow-y-auto scroll-fade-y pr-1">
                  {resultsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <ResultCardSkeleton key={i} />)
                  ) : resultsError ? (
                    <div className="p-6 text-center rounded-xl border border-dashed border-destructive/30">
                        <p className="text-sm text-destructive">{resultsError}</p>
                    </div>
                  ) : results.length > 0 ? (
                    results.map((result, index) => (
                      <motion.div
                        key={result.link}
                        data-result-index={index + 1}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 * index }}
                      >
                        <ResultCard result={result} index={index} />
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-6 text-center rounded-xl border border-dashed border-foreground/10">
                        <p className="text-sm text-muted-foreground">No results found.</p>
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
