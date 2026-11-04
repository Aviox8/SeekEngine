/**
 * StreamingAnswer Component
 *
 * Modern AI answer streaming with gradient processing indicators,
 * clean badges, and refined markdown rendering.
 *
 * Status copy is intentionally literal — retrieval steps, verification,
 * synthesis — rather than anthropomorphic. The about page's "auditable,
 * not magical" thesis carries through to the streaming UI.
 */

'use client'

import { useEffect, useRef, useState, CSSProperties, useMemo, memo } from 'react'
import { useStreamingAnswer, StreamState } from '../../hooks/useStreamingAnswer'
import type { StreamContextItem } from '../../hooks/useStreamingAnswer'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Response } from '../ui/response'
import { Sources } from '../ui/sources'
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

type StreamPhase = 'retrieving' | 'verifying' | 'synthesizing' | 'done'

const STATUS_LABELS: Record<StreamPhase, string> = {
  retrieving: 'Retrieving sources',
  verifying: 'Verifying citations',
  synthesizing: 'Synthesizing answer',
  done: 'Complete',
}

const STATUS_DETAILS: Record<StreamPhase, string> = {
  retrieving: 'Querying the public web for primary sources.',
  verifying: 'Checking each source for existence, freshness, and credibility.',
  synthesizing: 'Composing the answer from verified context only.',
  done: 'Grounded answer is ready. Every claim is linked to a source above.',
}

function phaseFromState(state: StreamState, hasContext: boolean): StreamPhase {
  if (state === 'done') return 'done'
  if (state === 'streaming') return 'synthesizing'
  if (state === 'thinking') return hasContext ? 'verifying' : 'retrieving'
  return 'retrieving'
}

function PhaseIndicator({ phase, sourceCount }: { phase: StreamPhase; sourceCount: number }) {
  const steps: { key: StreamPhase; label: string }[] = [
    { key: 'retrieving', label: 'Retrieve' },
    { key: 'verifying', label: 'Verify' },
    { key: 'synthesizing', label: 'Synthesize' },
  ]
  const stepIndex = phase === 'done' ? steps.length : steps.findIndex((s) => s.key === phase)

  return (
    <div className="mb-3 sm:mb-4 rounded-2xl border border-foreground/[0.06] bg-foreground/[0.01] px-3 py-3 sm:px-4 sm:py-3.5" role="status" aria-live="polite">
      <div className="flex items-center gap-2.5">
        {/* Active marker */}
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-foreground/[0.1] bg-background shrink-0">
          {phase === 'done' ? (
            <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className="flex items-center gap-0.5" aria-hidden="true">
              <span className="w-1 h-1 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
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

function getTierStyles(tier: string) {
  switch (tier) {
    case 'fast':
      return { className: 'bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 border-emerald-500/15' }
    case 'balanced':
      return { className: 'bg-blue-500/[0.08] text-blue-600 dark:text-blue-400 border-blue-500/15' }
    case 'heavy':
      return { className: 'bg-violet-500/[0.08] text-violet-600 dark:text-violet-400 border-violet-500/15' }
    case 'code':
      return { className: 'bg-amber-500/[0.08] text-amber-600 dark:text-amber-400 border-amber-500/15' }
    default:
      return { className: 'bg-foreground/[0.04] text-foreground/60 border-foreground/[0.08]' }
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

  // Latency bar width (max 100px for 5000ms)
  const latencyBarWidth = Math.min((latencyMs / 5000) * 100, 100)

  return (
    <div className="flex items-center gap-2 mt-5 pt-4 flex-wrap border-t border-foreground/5 animate-fade-in sm:gap-3 sm:mt-7 sm:pt-5">
      {cached && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-amber-500/[0.08] text-amber-600 dark:text-amber-400 border border-amber-500/15 sm:gap-1.5 sm:px-3 sm:py-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Cached</span>
        </span>
      )}

      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium border sm:gap-1.5 sm:px-3 sm:py-1 ${tierStyle.className}`}>
        {tier}
      </span>

      <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide sm:text-xs">
        {cached ? 'via' : 'by'}{' '}
        <span className="text-foreground/60 font-semibold">{modelHuman}</span>
      </span>

      <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wide ml-auto flex items-center gap-1.5 sm:text-xs">
        {cached ? (
          <>
            <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span>Instant</span>
          </>
        ) : (
          <>
            <svg className="w-3 h-3 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{latencyMs}ms</span>
            {/* Latency bar visualization */}
            <span className="hidden sm:inline-flex w-12 h-1 rounded-full bg-foreground/10 overflow-hidden">
              <span
                className="h-full rounded-full bg-foreground/30 transition-all duration-500"
                style={{ width: `${latencyBarWidth}%` }}
              />
            </span>
          </>
        )}
        {!cached && attempts > 1 && <span className="text-muted-foreground/40">• {attempts} attempts</span>}
      </span>
    </div>
  )
}

// PERFORMANCE: Memoize to prevent re-renders when parent updates
const MemoizedModelBadge = memo(ModelBadge)

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
    metadata,
    error,
    sources,
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

  const sourceCount = (context ?? []).length || (sources?.length ?? 0)
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
          <div className="w-full max-w-none animate-fade-in transition-all duration-700">
            <PhaseIndicator phase={phase} sourceCount={sourceCount} />
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
            <PhaseIndicator phase="done" sourceCount={sourceCount} />
            {sources && sources.length > 0 && (
              <Sources sources={sources} className="mb-6" />
            )}
            <Response className="min-h-[60px] sm:min-h-[100px]">
              {answer}
            </Response>

            <div className="flex items-center justify-between flex-wrap gap-3 mt-4 sm:gap-4 sm:mt-6">
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
                type="button"
                onClick={() => {
                  completed.current = false
                  lastStartedRequest.current = null
                  setRunCycle((current) => current + 1)
                  onRegenerate?.()
                  startCurrentStream()
                }}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide transition-all text-muted-foreground/70 hover:text-primary active:scale-95 group/regen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:gap-2.5 sm:text-xs"
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
            className="flex flex-col gap-2.5 p-3 rounded-lg bg-destructive/5 border border-destructive/20 sm:gap-3 sm:p-4 sm:rounded-xl"
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
              className="w-full px-3 py-2 text-[11px] font-medium rounded-full transition-all active:scale-95 bg-foreground/[0.04] border border-foreground/[0.08] text-foreground hover:bg-foreground/[0.06] flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:text-xs sm:gap-2"
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
      className={`relative overflow-x-hidden ${className}`}
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
