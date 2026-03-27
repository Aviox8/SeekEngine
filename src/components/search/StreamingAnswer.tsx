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
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import LivingIcon from '../shared/LivingIcon'
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
  "Analyzing query intent...",
  "Searching knowledge index...",
  "Synthesizing grounded answer...",
  "Verifying source citations..."
]

function ReasoningPanel({ state, step, content }: { state: StreamState, step: number, content?: string }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <motion.div 
      className="mb-6 rounded-xl border border-foreground/[0.04] bg-foreground/[0.01] overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-foreground/[0.02] transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-5 h-5">
            {state === 'thinking' ? (
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
            ) : (
              <LivingIcon size="w-5 h-5" color="#3B82F6" />
            )}
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground/70 transition-colors">
              {state === 'thinking' ? (
                <ShimmeringText text={`Thinking: ${STEPS[step]}`} duration={1.8} spread={1.5} />
              ) : 'Thought Process'}
            </span>
            {state === 'thinking' && (
              <span className="text-[9px] text-primary/40 font-medium uppercase tracking-tight">Processing</span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {content && (
                <motion.div 
                  className="text-[13px] leading-relaxed text-muted-foreground/80 border-l-2 border-primary/20 pl-4 py-1 italic bg-primary/[0.01] rounded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                   <ReactMarkdown components={{
                     p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>
                   }}>
                     {content}
                   </ReactMarkdown>
                </motion.div>
              )}

              <div className="space-y-2 pt-2">
                {STEPS.map((text, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-3"
                    animate={{ opacity: i > step ? 0.25 : i === step ? 1 : 0.5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div 
                      className="flex items-center justify-center w-4 h-4 rounded-full border border-foreground/10 shrink-0"
                      animate={{ scale: i === step ? 1.1 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {i < step ? (
                        <motion.svg 
                          className="w-2.5 h-2.5 text-primary" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          strokeWidth="3"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                      ) : i === step ? (
                        <motion.div 
                          className="w-1 h-1 rounded-full bg-primary" 
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />
                      ) : null}
                    </motion.div>
                    <span className={`text-[12px] font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

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

  return <ReasoningPanel state="thinking" step={step} />
}

// PERFORMANCE: Memoize to prevent re-renders when parent answer updates
const MemoizedProcessingSteps = memo(ProcessingSteps)

function ReasoningComplete({ step, content }: { step: number, content?: string }) {
  return <ReasoningPanel state="streaming" step={step} content={content} />
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
    reset,
    isLoading 
  } = useStreamingAnswer()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const lastStartedQuery = useRef<string | null>(null)
  const completed = useRef(false)
  const shouldAutoScroll = useRef(true)

  // PERF: Memoize streaming content to prevent re-renders when answer updates
  // Previously: content prop computed on every render, causing re-mount of MemoizedReasoningComplete
  const streamingContent = useMemo(() => {
    return metadata?.model.includes('deepseek') || metadata?.model.includes('o1') 
      ? "Developing comprehensive response..." 
      : undefined
  }, [metadata?.model])

  // Memoize done content
  const doneContent = useMemo(() => {
    return metadata?.cached ? "Result retrieved from neural search cache." : undefined
  }, [metadata?.cached])

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
            {/* PERF: Hide thought process during streaming - only show sources and answer */}
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
