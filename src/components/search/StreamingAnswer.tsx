/**
 * StreamingAnswer Component
 * 
 * Modern AI answer streaming with gradient processing indicators,
 * clean badges, and refined markdown rendering.
 */

'use client'

import { useEffect, useRef, useState, CSSProperties, useMemo, memo } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import { useStreamingAnswer, StreamState } from '../../hooks/useStreamingAnswer'

interface StreamingAnswerProps {
  query: string
  autoStart?: boolean
  className?: string
  style?: CSSProperties
  onComplete?: (answer: string) => void
  onRegenerate?: () => void
}

const STEPS = [
  "Analyzing query intent...",
  "Searching knowledge index...",
  "Synthesizing grounded answer...",
  "Verifying source citations..."
]

function ProcessingSteps() {
  const [step, setStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // PERFORMANCE: Only animate when visible (IntersectionObserver)
    const observer = new IntersectionObserver(([entry]) => {
      setIsPaused(!entry.isIntersecting)
    }, { threshold: 0.1 })
    
    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    const interval = setInterval(() => {
      if (!isPaused) {
        setStep(s => (s < STEPS.length - 1 ? s + 1 : s))
      }
    }, 900)
    
    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [isPaused])

  return (
    <div ref={elementRef} className="flex flex-col gap-4 py-3">
      {STEPS.map((text, i) => (
        <div 
          key={i} 
          className={`flex items-center gap-3 transition-all duration-500 ${i > step ? 'opacity-0 translate-y-2' : i === step ? 'opacity-100 translate-y-0' : 'opacity-25'}`}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
           {i === step ? (
             <div className="flex items-center gap-1.5 relative">
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-dot-pulse-1" />
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-dot-pulse-2 delay-100" />
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-dot-pulse-3 delay-200" />
             </div>
           ) : i < step ? (
             <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10">
               <svg className="w-3.5 h-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
               </svg>
             </div>
           ) : (
             <div className="w-5 h-5 rounded-full border border-foreground/10" />
           )}
           <span className={`text-[13px] font-medium transition-colors duration-300 ${i === step ? 'text-foreground' : i < step ? 'text-muted-foreground/50' : 'text-muted-foreground/30'}`}>
             {text}
           </span>
        </div>
      ))}
    </div>
  )
}

// PERFORMANCE: Memoize to prevent re-renders when parent answer updates
const MemoizedProcessingSteps = memo(ProcessingSteps)

function getTierStyles(tier: string) {
  switch (tier) {
    case 'fast':
      return { className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
    case 'balanced':
      return { className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
    case 'heavy':
      return { className: 'bg-violet-500/10 text-violet-500 border-violet-500/20' }
    case 'code':
      return { className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
    default:
      return { className: 'bg-muted text-muted-foreground border-border' }
  }
}

function ModelBadge({ 
  modelHuman, 
  tier, 
  latencyMs, 
  attempts,
  cached = false
}: { 
  modelHuman: string
  tier: string
  latencyMs: number
  attempts: number
  cached?: boolean
}) {
  const tierStyle = getTierStyles(tier)
  
  return (
    <div className="flex items-center gap-3 mt-7 pt-5 flex-wrap border-t border-foreground/5 animate-fade-in">
      {cached && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide bg-amber-500/8 text-amber-600 dark:text-amber-400 border border-amber-500/15 backdrop-blur-sm">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Cached</span>
        </span>
      )}
      
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide border backdrop-blur-sm ${tierStyle.className}`}>
        {tier}
      </span>
      
      <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide">
        {cached ? 'via' : 'by'}{' '}
        <span className="text-foreground/60 font-semibold">{modelHuman}</span>
      </span>
      
      <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide ml-auto">
        {cached ? '⚡ Instant' : `⏱ ${latencyMs}ms`}
        {!cached && attempts > 1 && <span className="ml-1 text-muted-foreground/40">• {attempts} attempts</span>}
      </span>
    </div>
  )
}

// PERFORMANCE: Memoize to prevent re-renders when parent updates
const MemoizedModelBadge = memo(ModelBadge)

export function StreamingAnswer({ 
  query, 
  autoStart = true, 
  className = '',
  style,
  onComplete,
  onRegenerate,
}: StreamingAnswerProps) {
  const { 
    answer, 
    state, 
    metadata, 
    error, 
    startStream, 
    reset,
    isLoading 
  } = useStreamingAnswer()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const lastStartedQuery = useRef<string | null>(null)
  const completed = useRef(false)
  const shouldAutoScroll = useRef(true)

  // PERFORMANCE: Memoize markdown components to prevent recreation on every render
  const markdownComponents = useMemo<Components>(() => ({
    h1: (props) => <h1 className="text-2xl font-semibold mt-8 mb-4 tracking-tight text-foreground" {...props} />,
    h2: (props) => <h2 className="text-xl font-semibold mt-8 mb-3 tracking-tight text-foreground" {...props} />,
    h3: (props) => <h3 className="text-lg font-medium mt-6 mb-3 text-foreground/90" {...props} />,
    a: ({ href, children }) => (
      href && /^(https?:\/\/|\/)/.test(href)
        ? <a href={href} target="_blank" rel="noopener noreferrer" className="underline transition-colors text-foreground hover:text-foreground/60 decoration-foreground/20" children={children} />
        : <span children={children} />
    ),
    code: (props) => <code className="px-1.5 py-0.5 rounded-md font-mono text-[13px] border border-foreground/10 bg-foreground/[0.03] text-foreground/80" {...props} />,
    pre: (props) => (
      <div className="my-6 rounded-xl overflow-hidden border border-border/50 shadow-lg bg-card">
        <pre className="p-4 overflow-x-auto" {...props} />
      </div>
    ),
    ul: (props) => <ul className="flex flex-col gap-3 mb-3 ml-1" {...props} />,
    li: ({ children }) => (
      <div className="flex items-start gap-3 ml-1">
        <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 bg-foreground/25" />
        <span className="text-[17px] leading-relaxed text-foreground/85">{children}</span>
      </div>
    ),
    strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
    em: (props) => <em className="italic text-muted-foreground" {...props} />,
  }), [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onScroll = () => {
      shouldAutoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (autoStart && query && lastStartedQuery.current !== query) {
      lastStartedQuery.current = query
      completed.current = false
      startStream(query)
    }
  }, [query, autoStart, startStream])

  useEffect(() => {
    if (state === 'done' && onComplete && answer && !completed.current) {
      completed.current = true
      onComplete(answer)
    }
  }, [state, answer, onComplete])

  useEffect(() => {
    if (state === 'streaming' && containerRef.current && shouldAutoScroll.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [answer, state])

  const renderContent = () => {
    switch (state) {
      case 'idle':
      case 'thinking':
        return (
          <div className="animate-fade-in-up">
            <MemoizedProcessingSteps />
          </div>
        )
        
      case 'streaming':
        return (
          <div className="w-full max-w-none animate-fade-in">
            <div className="prose prose-zinc dark:prose-invert max-w-none text-[16px] leading-8 font-[inherit]">
              <ReactMarkdown components={markdownComponents}>
                {answer + ' ▊'}
              </ReactMarkdown>
            </div>
          </div>
        )
        
      case 'done':
        return (
          <div className="w-full animate-fade-in">
            <div className="prose prose-zinc dark:prose-invert max-w-none text-[16px] leading-8 font-[inherit]">
              {answer ? (
                <ReactMarkdown components={markdownComponents}>{answer}</ReactMarkdown>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-muted-foreground/50 italic">No content generated.</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              {metadata && (
                <MemoizedModelBadge 
                  modelHuman={metadata.modelHuman}
                  tier={metadata.tier}
                  latencyMs={metadata.latencyMs}
                  attempts={metadata.attempts}
                  cached={metadata.cached}
                />
              )}
              <button
                onClick={() => {
                  completed.current = false
                  lastStartedQuery.current = null
                  onRegenerate?.()
                  startStream(query)
                }}
                className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wide transition-all text-muted-foreground/70 hover:text-primary active:scale-95 group/regen"
                title="Regenerate answer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/regen:rotate-180 transition-transform duration-700">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                Regenerate
              </button>
            </div>
          </div>
        )
        
      case 'error':
        return (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20 animate-fade-in">
            <svg className="w-5 h-5 shrink-0 text-destructive mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <div className="flex-1 flex items-center gap-3">
              <span className="text-sm font-medium text-destructive">{error || 'An error occurred'}</span>
              <button 
                onClick={() => {
                  completed.current = false
                  startStream(query)
                }}
                className="ml-auto px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-lg transition-all active:scale-95 bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/15"
              >
                Retry
              </button>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={style}
    >
      <div className="relative">
        {/* Subtle background glow on streaming */}
        {state === 'streaming' && (
          <div className="absolute -inset-8 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-40" />
        )}
        <div className="relative">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export type { StreamState }
