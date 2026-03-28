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

type QueryIntent = 'compare' | 'howto' | 'recent' | 'decision' | 'local' | 'general'

type ReasoningScript = {
  headings: {
    thinking: string
    streaming: string
    done: string
  }
  leads: {
    streaming: string
    done: string
  }
  statusText: string
  steps: string[]
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i',
  'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what',
  'when', 'where', 'which', 'who', 'why', 'with', 'you', 'your'
])

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(maxLength - 3, 0)).trimEnd()}...`
}

function normalizeQuery(query: string) {
  return query.replace(/\s+/g, ' ').trim()
}

function extractKeywords(query: string, limit = 3) {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))

  const unique: string[] = []
  for (const word of words) {
    if (!unique.includes(word)) {
      unique.push(word)
    }
    if (unique.length >= limit) break
  }
  return unique
}

function detectIntent(query: string): QueryIntent {
  const lower = query.toLowerCase()

  if (/\b(vs|versus|compare|comparison|difference|better)\b/.test(lower)) return 'compare'
  if (/\b(how|guide|steps|tutorial|implement|build|fix)\b/.test(lower)) return 'howto'
  if (/\b(latest|news|today|recent|update|trend|202[0-9])\b/.test(lower)) return 'recent'
  if (/\b(best|top|recommend|should|choose|worth)\b/.test(lower)) return 'decision'
  if (/\b(near me|nearby|local|location|city|country)\b/.test(lower)) return 'local'
  return 'general'
}

function buildReasoningScript(query: string, runCycle: number): ReasoningScript {
  const clean = normalizeQuery(query)
  const queryLabel = clean ? `"${truncateText(clean, 78)}"` : 'your question'
  const keywords = extractKeywords(clean)
  const focusPhrase = keywords.length > 0
    ? keywords.slice(0, 2).join(' and ')
    : 'the core topic'
  const statusTopic = keywords.length > 0
    ? truncateText(keywords.slice(0, 2).join(' + '), 20)
    : 'your answer'

  const intent = detectIntent(clean)
  const intentGoalMap: Record<QueryIntent, string> = {
    compare: 'a side-by-side comparison',
    howto: 'a practical step-by-step answer',
    recent: 'fresh and current guidance',
    decision: 'a recommendation you can act on',
    local: 'location-specific guidance',
    general: 'a direct answer',
  }

  const seed = Math.abs(hashString(`${clean}|${runCycle}`))
  const pick = (options: string[], offset: number) => options[(seed + offset) % options.length]

  const headingSet = {
    thinking: pick([
      'Working Through Your Search',
      'Mapping Your Search Intent',
      'Building Your Answer Logic',
    ], 0),
    streaming: pick([
      'Writing Your Response',
      'Composing The Final Draft',
      'Turning Findings Into Answers',
    ], 1),
    done: pick([
      'Answer Ready',
      'Reasoning Pass Complete',
      'Final Review Complete',
    ], 2),
  }

  const steps = [
    pick([
      `I'm mapping ${queryLabel} into the exact points that need evidence.`,
      `I'm breaking ${queryLabel} into focused sub-questions before writing.`,
      `I'm framing what ${queryLabel} is really asking so the answer stays on target.`,
    ], 3),
    pick([
      `I'm pulling high-signal sources around ${focusPhrase} and filtering repetitive noise.`,
      `I'm gathering reliable details on ${focusPhrase} and dropping weak matches.`,
      `I'm scanning multiple references on ${focusPhrase} before I draft your answer.`,
    ], 4),
    pick([
      `I'm connecting the findings into ${intentGoalMap[intent]} tailored to your query.`,
      `I'm shaping the evidence into ${intentGoalMap[intent]} that directly answers you.`,
      `I'm organizing the strongest points into ${intentGoalMap[intent]} without extra fluff.`,
    ], 5),
    pick([
      "I'm doing a final pass for factual consistency and citation quality.",
      "I'm validating key claims one more time before finalizing.",
      "I'm checking clarity, accuracy, and source alignment before I submit.",
    ], 6),
  ]

  return {
    headings: headingSet,
    leads: {
      streaming: pick([
        `I'm drafting the final response for ${queryLabel} and keeping every point grounded in sources.`,
        `I'm now writing your answer for ${queryLabel}, keeping it concise and evidence-backed.`,
        `I'm turning the research on ${focusPhrase} into a clean response you can use immediately.`,
      ], 7),
      done: pick([
        `I finished a final quality pass so this answer stays aligned with ${queryLabel}.`,
        `I completed the reasoning pass and kept only details that directly support ${queryLabel}.`,
        `I wrapped up with one more check so the response remains accurate and relevant to your search.`,
      ], 8),
    },
    statusText: `drafting ${statusTopic}...`,
    steps,
  }
}

function ReasoningPanel({
  state,
  step,
  content,
  script,
}: {
  state: StreamState
  step: number
  content?: string
  script: ReasoningScript
}) {
  const activeStep = Math.min(Math.max(step, 0), script.steps.length - 1)
  const heading = state === 'thinking'
    ? script.headings.thinking
    : state === 'streaming'
      ? script.headings.streaming
      : script.headings.done
  const leadText = state === 'thinking'
    ? script.steps[activeStep]
    : state === 'streaming'
      ? script.leads.streaming
      : script.leads.done

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
                <ShimmeringText text={script.statusText} duration={1.8} spread={1.25} />
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">
            {leadText}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 border-l border-foreground/10 pl-3.5">
        {script.steps.map((text, i) => {
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

function ProcessingSteps({ script, runCycle }: { script: ReasoningScript, runCycle: number }) {
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
    if (isPaused || step >= script.steps.length - 1) return

    const variance = Math.abs(hashString(`${script.statusText}:${runCycle}:${step}`)) % 240
    const delay = 980 + step * 170 + variance
    const timeout = window.setTimeout(() => {
      setStep((s) => (s < script.steps.length - 1 ? s + 1 : s))
    }, delay)

    return () => window.clearTimeout(timeout)
  }, [isPaused, step, script.steps.length, script.statusText, runCycle])

  return (
    <div ref={elementRef}>
      <ReasoningPanel state="thinking" step={step} script={script} />
    </div>
  )
}

// PERFORMANCE: Memoize to prevent re-renders when parent answer updates
const MemoizedProcessingSteps = memo(ProcessingSteps)

function ReasoningComplete({ step, content, script }: { step: number, content?: string, script: ReasoningScript }) {
  return <ReasoningPanel state="done" step={step} content={content} script={script} />
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
  const [runCycle, setRunCycle] = useState(0)

  const reasoningScript = useMemo(() => {
    return buildReasoningScript(query, runCycle)
  }, [query, runCycle])

  const streamingStep = useMemo(() => {
    const maxStep = reasoningScript.steps.length - 1
    if (answer.length < 80) return Math.min(1, maxStep)
    if (answer.length < 260) return Math.min(2, maxStep)
    return maxStep
  }, [answer, reasoningScript.steps.length])

  // Memoize done content
  const doneContent = useMemo(() => {
    if (!metadata) return undefined

    const normalized = normalizeQuery(query)
    const queryLabel = normalized ? `"${truncateText(normalized, 66)}"` : 'your search'

    return metadata.cached
      ? `I found a recent matching result for ${queryLabel} and reused it so you get the same answer faster.`
      : `I finished with a final clarity pass so this response stays tightly aligned with ${queryLabel}.`
  }, [metadata, query])

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
            <MemoizedProcessingSteps key={`${query}:${runCycle}`} script={reasoningScript} runCycle={runCycle} />
          </div>
        )
        
      case 'streaming':
        return (
          <div className="w-full max-w-none animate-fade-in transition-all duration-700">
            <ReasoningPanel state="streaming" step={streamingStep} script={reasoningScript} />
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
              step={reasoningScript.steps.length - 1}
              content={doneContent}
              script={reasoningScript}
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
                  setRunCycle((current) => current + 1)
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
                setRunCycle((current) => current + 1)
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
