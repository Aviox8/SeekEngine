/**
 * StreamingAnswer Component
 *
 * Modern AI answer streaming with gradient processing indicators
 * and refined markdown rendering.
 *
 * Status copy is intentionally literal — retrieval steps, source review,
 * synthesis — rather than anthropomorphic or invented verification theatre.
 */

'use client'

import { useEffect, useRef, useState, CSSProperties, useMemo } from 'react'
import { useStreamingAnswer, StreamState } from '../../hooks/useStreamingAnswer'
import type { StreamContextItem } from '../../hooks/useStreamingAnswer'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Response } from '../ui/response'
import type { SearchResult } from '../../lib/google-search'

interface StreamingAnswerProps {
  query: string
  autoStart?: boolean
  timeRange?: string
  context?: SearchResult[]
  waitForContext?: boolean
  contextReady?: boolean
  className?: string
  style?: CSSProperties
  onComplete?: (answer: string) => void
  onRegenerate?: () => void
}

type StreamPhase = 'retrieving' | 'reviewing' | 'synthesizing' | 'done'

const STATUS_LABELS: Record<StreamPhase, string> = {
  retrieving: 'Querying the web',
  reviewing: 'Reviewing sources',
  synthesizing: 'Synthesizing answer',
  done: 'Complete',
}

const STATUS_DETAILS: Record<StreamPhase, string> = {
  retrieving: 'Searching the public web for primary sources.',
  reviewing: 'Reading the retrieved sources before answering.',
  synthesizing: 'Writing the answer from the retrieved context only.',
  done: 'Grounded answer ready. Every claim links to a source.',
}

function phaseFromState(state: StreamState, hasContext: boolean): StreamPhase {
  if (state === 'done') return 'done'
  if (state === 'streaming') return 'synthesizing'
  if (state === 'thinking') return hasContext ? 'reviewing' : 'retrieving'
  return 'retrieving'
}

function PhaseIndicator({ phase, sourceCount }: { phase: StreamPhase; sourceCount: number }) {
  const steps: { key: StreamPhase; label: string }[] = [
    { key: 'retrieving', label: 'Retrieve' },
    { key: 'reviewing', label: 'Review' },
    { key: 'synthesizing', label: 'Synthesize' },
  ]
  const stepIndex = phase === 'done' ? steps.length : steps.findIndex((s) => s.key === phase)

  return (
    <div className="mb-3 sm:mb-4 rounded-2xl bg-foreground/[0.02] px-3 py-3 sm:px-4 sm:py-3.5" role="status" aria-live="polite">
      <div className="flex items-center gap-2.5">
        {/* Active marker */}
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-sm shrink-0">
          {phase === 'done' ? (
            <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className="flex items-center gap-0.5" aria-hidden="true">
              <span className="thinking-dot w-1 h-1 rounded-full bg-foreground/60" style={{ animationDelay: '0ms' }} />
              <span className="thinking-dot w-1 h-1 rounded-full bg-foreground/60" style={{ animationDelay: '150ms' }} />
              <span className="thinking-dot w-1 h-1 rounded-full bg-foreground/60" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[11px] sm:text-xs font-semibold text-foreground/70">
              {STATUS_LABELS[phase]}
            </p>
            {phase !== 'done' && sourceCount > 0 && (
              <span className="text-[10px] sm:text-[11px] font-medium tabular-nums text-foreground/35">
                {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] sm:text-xs leading-relaxed text-foreground/45">
            {STATUS_DETAILS[phase]}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mt-3 flex items-center gap-1.5 sm:gap-2" aria-hidden="true">
        {steps.map((s, i) => {
          const isComplete = i < stepIndex
          const isActive = i === stepIndex && phase !== 'done'
          return (
            <div key={s.key} className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                  isComplete || isActive
                    ? 'bg-foreground/40'
                    : 'bg-foreground/[0.08]'
                }`}
                style={isActive ? { animation: 'pulse 1.6s ease-in-out infinite' } : undefined}
              />
              <span className={`text-[9px] sm:text-[10px] font-medium uppercase tracking-wider ${
                isComplete || isActive ? 'text-foreground/45' : 'text-foreground/20'
              }`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}


export function StreamingAnswer({
  query,
  autoStart = true,
  timeRange,
  context,
  waitForContext = false,
  contextReady = true,
  className = '',
  style,
  onComplete,
  onRegenerate,
}: StreamingAnswerProps) {
  const {
    answer,
    state,
    error,
    startStream,
    reset,
  } = useStreamingAnswer()

  const containerRef = useRef<HTMLDivElement>(null)
  const lastStartedRequest = useRef<string | null>(null)
  const completed = useRef(false)
  const shouldAutoScroll = useRef(true)
  const [, setRunCycle] = useState(0)
  const requestKey = `${query}::${timeRange ?? ''}`

  // PERF FIX: Serialize context to create a stable dependency key
  // (array refs change every render, making useMemo pointless)
  const contextKey = useMemo(() => JSON.stringify(
    (context ?? []).map(r => r.link)
  ), [context])

  const normalizedContext = useMemo<StreamContextItem[]>(() => {
    return (context ?? []).map(({ title, link, snippet }) => ({
      title,
      link,
      snippet,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey])

  const sourceCount = (context ?? []).length
  const phase = phaseFromState(state, sourceCount > 0)

  const startCurrentStream = useMemo(() => {
    return () => startStream(query, {
      timeRange,
      context: normalizedContext,
      hasProvidedContext: waitForContext,
    })
  }, [normalizedContext, query, startStream, timeRange, waitForContext])

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
    completed.current = false
    lastStartedRequest.current = null
    reset()
  }, [requestKey, reset])

  useEffect(() => {
    if (!autoStart || !query) return
    if (waitForContext && !contextReady) return
    if (lastStartedRequest.current === requestKey) return

    lastStartedRequest.current = requestKey
    completed.current = false
    startCurrentStream()
  }, [autoStart, contextReady, query, requestKey, startCurrentStream, waitForContext])

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
            <PhaseIndicator phase={phase} sourceCount={sourceCount} />
          </div>
        )

      case 'streaming':
        return (
          <div className="w-full max-w-none animate-fade-in">
            <PhaseIndicator phase={phase} sourceCount={sourceCount} />
            <Response isStreaming className="min-h-[100px]">
              {answer}
            </Response>
          </div>
        )

      case 'done':
        return (
          <div className="w-full animate-fade-in">
            <span className="sr-only" role="status">Answer complete.</span>
            <Response className="min-h-[60px] sm:min-h-[100px]">
              {answer}
            </Response>

            <div className="flex items-center justify-end gap-3 mt-4 sm:gap-4 sm:mt-6">
              <button
                type="button"
                onClick={() => {
                  completed.current = false
                  lastStartedRequest.current = null
                  setRunCycle((current) => current + 1)
                  onRegenerate?.()
                  startCurrentStream()
                }}
                className="flex items-center gap-1.5 text-[10px] font-semibold transition-[color,transform] text-muted-foreground/70 hover:text-primary active:scale-95 group/regen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:gap-2.5 sm:text-xs"
                aria-label="Regenerate answer"
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
            className="flex flex-col gap-2.5 p-3 rounded-lg bg-destructive/5  sm:gap-3 sm:p-4 sm:rounded-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-destructive sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-destructive sm:text-sm">{error || 'Failed to generate answer'}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5 sm:text-xs">This might be a temporary issue. Please try again.</p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={() => {
                completed.current = false
                lastStartedRequest.current = null
                setRunCycle((current) => current + 1)
                startCurrentStream()
              }}
               className="w-full px-3 py-2 text-[11px] font-medium rounded-full transition-[color,background-color,transform] active:scale-95 bg-foreground/[0.04] text-foreground hover:bg-foreground/[0.06] flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:text-xs sm:gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Try Again
            </motion.button>
          </motion.div>
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
      aria-busy={state === 'thinking' || state === 'streaming'}
    >
      <div className="relative">
        {renderContent()}
      </div>
    </div>
  )
}

export type { StreamState }
