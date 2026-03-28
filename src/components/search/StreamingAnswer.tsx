/**
 * StreamingAnswer Component
 * 
 * Modern AI answer streaming with gradient processing indicators,
 * clean badges, and refined markdown rendering.
 */

'use client'

import { useEffect, useRef, useState, CSSProperties, useMemo, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import { useStreamingAnswer, StreamState } from '../../hooks/useStreamingAnswer'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { ShimmeringText } from '../ui/shimmering-text'
import { Response } from '../ui/response'
import { Sources } from '../ui/sources'

interface StreamingAnswerProps {
  query: string
  autoStart?: boolean
  className?: string
  style?: CSSProperties
  onComplete?: (answer: string) => void
  onRegenerate?: () => void
}

const STEPS = [
  "I'm reading your question and clarifying what you really need.",
  "I'm gathering the strongest facts and examples.",
  "I'm shaping everything into a clear, direct answer.",
  "I'm doing a final check for accuracy and citations."
]

function ReasoningPanel({ state, step, content }: { state: StreamState, step: number, content?: string }) {
  const activeStep = Math.min(Math.max(step, 0), STEPS.length - 1)
  const heading = state === 'thinking'
    ? 'Working Through Your Question'
    : state === 'streaming'
      ? 'Drafting The Final Answer'
      : 'Answer Review Complete'
  const leadText = state === 'thinking'
    ? STEPS[activeStep]
    : state === 'streaming'
      ? "I'm writing the response now and keeping it grounded in the source material."
      : "I've finished the reasoning pass and kept only the points that directly support your answer."

  return (
    <motion.div 
      className="mb-6 rounded-2xl border border-foreground/[0.08] bg-background/80 px-4 py-4 sm:px-5 sm:py-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-foreground/10">
          {state === 'thinking' || state === 'streaming' ? (
            <Loader2 className="h-3 w-3 text-primary animate-spin" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-primary/60" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
              {heading}
            </p>
            {state === 'thinking' && (
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/[0.05] px-2 py-0.5 text-[10px] font-medium text-primary/70">
                <ShimmeringText text="drafting..." duration={1.8} spread={1.25} />
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">
            {leadText}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 border-l border-foreground/10 pl-3.5">
        {STEPS.map((text, i) => {
          const isDone = state === 'done' || i < activeStep
          const isActive = state !== 'done' && i === activeStep

          return (
            <motion.div
              key={i}
              className="flex items-start gap-3"
              animate={{ opacity: isDone || isActive ? 1 : 0.45 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-foreground/15 bg-background">
                {isDone ? (
                  <svg className="h-2.5 w-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.45, 1] }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                  />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/45" />
                )}
              </div>
              <p className={`text-[12px] leading-relaxed ${isDone || isActive ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                {text}
              </p>
            </motion.div>
          )
        })}
      </div>

      {content && (
        <motion.div
          className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.04] px-3.5 py-3 text-[12px] leading-relaxed text-foreground/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            }}
          >
            {content}
          </ReactMarkdown>
        </motion.div>
      )}
    </motion.div>
  )
}

function ProcessingSteps() {
  const [step, setStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsPaused(!entry.isIntersecting)
    }, { threshold: 0.1 })

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isPaused || step >= STEPS.length - 1) return

    const delay = 1050 + step * 180 + Math.floor(Math.random() * 180)
    const timeout = window.setTimeout(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s))
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [isPaused, step])

  return (
    <div ref={elementRef}>
      <ReasoningPanel state="thinking" step={step} />
    </div>
  )
}

// PERFORMANCE: Memoize to prevent re-renders when parent answer updates
const MemoizedProcessingSteps = memo(ProcessingSteps)

function ReasoningComplete({ step, content }: { step: number, content?: string }) {
  return <ReasoningPanel state="done" step={step} content={content} />
}
const MemoizedReasoningComplete = memo(ReasoningComplete)

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
    sources,
    startStream, 
  } = useStreamingAnswer()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const lastStartedQuery = useRef<string | null>(null)
  const completed = useRef(false)
  const shouldAutoScroll = useRef(true)

  // Memoize done content
  const doneContent = useMemo(() => {
    if (!metadata) return undefined
    return metadata.cached
      ? "I found a recent matching result and reused it so you get the same answer faster."
      : "I finished with a quick clarity pass so the final answer is direct and easy to use."
  }, [metadata])

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
          <div className="w-full max-w-none animate-fade-in transition-all duration-700">
            <ReasoningPanel state="streaming" step={2} />
            {sources && sources.length > 0 && (
              <Sources sources={sources} className="mb-6" />
            )}
            <Response isStreaming className="min-h-[100px]">
              {answer}
            </Response>
          </div>
        )
        
      case 'done':
        return (
          <div className="w-full animate-fade-in transition-all duration-700">
            <MemoizedReasoningComplete 
              step={STEPS.length - 1} 
              content={doneContent}
            />
            {sources && sources.length > 0 && (
              <Sources sources={sources} className="mb-6" />
            )}
            <Response className="min-h-[100px]">
              {answer}
            </Response>

            <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
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
          <motion.div 
            className="flex flex-col gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-destructive mt-0.5" />
              <span className="text-sm font-medium text-destructive flex-1">{error || 'Failed to generate answer'}</span>
            </div>
            <button 
              onClick={() => {
                completed.current = false
                startStream(query)
              }}
              className="w-full px-3 py-2 text-xs font-semibold uppercase tracking-wide rounded-lg transition-all active:scale-95 bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/15 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </motion.div>
        )
        
      default:
        return null
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-x-hidden ${className}`}
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
