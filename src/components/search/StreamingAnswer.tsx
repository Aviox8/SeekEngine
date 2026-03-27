/**
 * StreamingAnswer Component
 * 
 * Modern AI answer streaming with gradient processing indicators,
 * clean badges, and refined markdown rendering.
 */

'use client'

import { useEffect, useRef, useState, CSSProperties } from 'react'
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

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s < STEPS.length - 1 ? s + 1 : s))
    }, 900)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-3 py-2">
      {STEPS.map((text, i) => (
        <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i > step ? 'opacity-0 translate-y-1' : i === step ? 'opacity-100' : 'opacity-30'}`}>
           {i === step ? (
             <div className="flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-dot-pulse-1" />
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-dot-pulse-2" />
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-dot-pulse-3" />
             </div>
           ) : (
             <svg className="w-4 h-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
             </svg>
           )}
           <span className={`text-sm font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground/40'}`}>{text}</span>
        </div>
      ))}
    </div>
  )
}

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
    <div className="flex items-center gap-2 mt-5 pt-4 flex-wrap border-t border-border/30">
      {cached && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          cached
        </span>
      )}
      
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${tierStyle.className}`}>
        {tier}
      </span>
      
      <span className="text-[11px] text-muted-foreground">
        {cached ? 'via' : 'by'}{' '}
        <span className="font-medium text-foreground/70">{modelHuman}</span>
      </span>
      
      <span className="text-[11px] text-muted-foreground/50">
        {cached ? 'instant' : `${latencyMs}ms`}
        {!cached && attempts > 1 && `  ${attempts} attempts`}
      </span>
    </div>
  )
}

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
    // CRITICAL FIX: Custom markdown renderer using react-markdown
    // Prevents XSS attacks through prompt injection or malicious markdown
    const markdownComponents: Components = {
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
    }

    switch (state) {
      case 'idle':
      case 'thinking':
        return <ProcessingSteps />
        
      case 'streaming':
        return (
          <div className="w-full max-w-none">
            <div className="prose prose-zinc dark:prose-invert max-w-none text-[17px] leading-7 font-[inherit]">
              <ReactMarkdown components={markdownComponents}>
                {answer + ' ▊'}
              </ReactMarkdown>
            </div>
          </div>
        )
        
      case 'done':
        return (
          <div className="w-full">
            <div className="prose prose-zinc dark:prose-invert max-w-none text-[17px] leading-7 font-[inherit]">
              {answer ? (
                <ReactMarkdown components={markdownComponents}>{answer}</ReactMarkdown>
              ) : (
                <p className="opacity-50 italic">No content generated.</p>
              )}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              {metadata && (
                <ModelBadge 
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
                className="mt-5 pt-4 flex items-center gap-2 text-xs font-medium transition-all text-muted-foreground hover:text-primary group/regen"
                title="Regenerate answer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/regen:rotate-180 transition-transform duration-500">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                Regenerate
              </button>
            </div>
          </div>
        )
        
      case 'error':
        return (
          <div className="flex items-center gap-2 text-destructive">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span className="text-sm">{error || 'An error occurred'}</span>
            <button 
              onClick={() => {
                completed.current = false
                startStream(query)
              }}
              className="ml-2 px-3 py-1 text-xs rounded-lg transition-colors bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20"
            >
              Retry
            </button>
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
      {renderContent()}
    </div>
  )
}

export type { StreamState }
