/**
 * StreamingAnswer Component
 * 
 * Modern AI answer streaming with gradient processing indicators,
 * clean badges, and refined markdown rendering.
 */

'use client'

import { useEffect, useRef, useState, CSSProperties, useMemo, memo } from 'react'
import { useStreamingAnswer, StreamState } from '../../hooks/useStreamingAnswer'
import type { StreamContextItem } from '../../hooks/useStreamingAnswer'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { ShimmeringText } from '../ui/shimmering-text'
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

type IntentMicroTone = {
  thinkingHeadings: string[]
  streamingHeadings: string[]
  doneHeadings: string[]
  statusVerbs: string[]
  step1Hints: string[]
  step2Hints: string[]
  step3Hints: string[]
  streamingHints: string[]
  doneHints: string[]
}

const INTENT_MICRO_TONES: Record<QueryIntent, IntentMicroTone> = {
  compare: {
    thinkingHeadings: ['Weighing Side By Side', 'Balancing The Tradeoffs', 'Comparing What Matters'],
    streamingHeadings: ['Writing A Balanced Comparison', 'Turning Tradeoffs Into Guidance', 'Composing A Side-By-Side Answer'],
    doneHeadings: ['Comparison Ready', 'Tradeoff Review Complete', 'Balanced Verdict Ready'],
    statusVerbs: ['weighing options on', 'mapping tradeoffs for', 'comparing signals for'],
    step1Hints: [
      'I am separating must-have criteria from nice-to-have points first.',
      'I am locking comparison dimensions early so the answer stays fair.',
      'I am identifying shared ground before spotlighting real differences.',
    ],
    step2Hints: [
      'I am favoring apples-to-apples evidence and skipping marketing noise.',
      'I am checking both strengths and weak spots so one side is not overhyped.',
      'I am validating each claim across multiple references before scoring it.',
    ],
    step3Hints: [
      'I am framing recommendations by context instead of forcing one universal winner.',
      'I am surfacing tradeoffs you will actually feel in practical usage.',
      'I am keeping the final pick conditional on your likely priorities.',
    ],
    streamingHints: [
      'I am keeping the wording neutral so the choice remains yours.',
      'I am emphasizing what changes the decision in real-world scenarios.',
      'I am making the contrast clear without adding unnecessary hype.',
    ],
    doneHints: [
      'The final comparison stays balanced and criteria-driven.',
      'I kept the conclusion grounded in tradeoffs, not absolute claims.',
      'You can now pick based on priorities rather than guesswork.',
    ],
  },
  howto: {
    thinkingHeadings: ['Building A Practical Plan', 'Laying Out The Steps', 'Turning Intent Into Action'],
    streamingHeadings: ['Writing Actionable Steps', 'Composing The Execution Plan', 'Turning Research Into A Playbook'],
    doneHeadings: ['Step Plan Ready', 'Execution Path Complete', 'How-To Draft Finalized'],
    statusVerbs: ['laying out steps for', 'building an action plan for', 'mapping implementation for'],
    step1Hints: [
      'I am identifying the cleanest path from first step to finished result.',
      'I am structuring this into a sequence you can execute without backtracking.',
      'I am clarifying prerequisites first so the rest flows smoothly.',
    ],
    step2Hints: [
      'I am pulling examples that are practical to apply right away.',
      'I am filtering out theoretical detours and keeping only useful actions.',
      'I am prioritizing steps that reduce setup friction and avoid common pitfalls.',
    ],
    step3Hints: [
      'I am shaping the answer so each step has a clear outcome.',
      'I am organizing it for fast execution, not just explanation.',
      'I am keeping the order realistic so it works in an actual workflow.',
    ],
    streamingHints: [
      'I am optimizing this for clarity so you can start immediately.',
      'I am writing with an action-first tone and minimal fluff.',
      'I am focusing on decisions and steps you can directly apply.',
    ],
    doneHints: [
      'The final answer is structured to be followed, not just read.',
      'I kept the instructions concise so execution stays smooth.',
      'You should be able to move from this response straight into action.',
    ],
  },
  recent: {
    thinkingHeadings: ['Checking Fresh Signals', 'Prioritizing Recent Evidence', 'Filtering By Recency'],
    streamingHeadings: ['Writing With Fresh Context', 'Composing A Current Snapshot', 'Turning Updates Into Clarity'],
    doneHeadings: ['Fresh View Ready', 'Recency Review Complete', 'Current Snapshot Finalized'],
    statusVerbs: ['checking freshness for', 'verifying recent updates for', 'sorting latest signals for'],
    step1Hints: [
      'I am setting a freshness lens so stale references do not dominate.',
      'I am focusing on what changed recently before summarizing the topic.',
      'I am scoping the timeline first so older material is weighted correctly.',
    ],
    step2Hints: [
      'I am cross-checking timestamps to avoid outdated guidance.',
      'I am prioritizing newer sources while still validating consistency.',
      'I am separating confirmed updates from rumors and low-confidence chatter.',
    ],
    step3Hints: [
      'I am connecting updates into a coherent picture of what matters now.',
      'I am framing the answer around new shifts and their practical impact.',
      'I am highlighting what is still true versus what has recently changed.',
    ],
    streamingHints: [
      'I am keeping the narrative time-aware so the answer feels current.',
      'I am calling out timeline-sensitive details where they change conclusions.',
      'I am emphasizing what is new so you can act on the latest context.',
    ],
    doneHints: [
      'The final answer favors freshness without sacrificing reliability.',
      'I kept the response anchored in recent, verifiable context.',
      'You should see a clear split between established facts and recent updates.',
    ],
  },
  decision: {
    thinkingHeadings: ['Weighing The Decision', 'Ranking What Matters Most', 'Scoring The Options'],
    streamingHeadings: ['Writing A Practical Recommendation', 'Composing Decision Guidance', 'Turning Evidence Into A Pick'],
    doneHeadings: ['Recommendation Ready', 'Decision Review Complete', 'Priority-Based Verdict Ready'],
    statusVerbs: ['ranking priorities for', 'weighing choices for', 'building a recommendation for'],
    step1Hints: [
      'I am identifying decision criteria that genuinely change outcomes.',
      'I am translating your query into a shortlist of practical priorities.',
      'I am defining the decision frame so recommendations stay relevant.',
    ],
    step2Hints: [
      'I am pulling evidence for each option against the same scoring lens.',
      'I am testing claims against constraints like effort, risk, and payoff.',
      'I am separating high-confidence signals from opinion-heavy advice.',
    ],
    step3Hints: [
      'I am mapping each option to the context where it wins.',
      'I am turning the evidence into a recommendation with clear conditions.',
      'I am keeping uncertainty visible so the recommendation stays honest.',
    ],
    streamingHints: [
      'I am making the recommendation explicit while preserving nuance.',
      'I am highlighting when a different priority would flip the best choice.',
      'I am keeping the verdict practical, not absolute.',
    ],
    doneHints: [
      'The recommendation is tied to priorities rather than broad assumptions.',
      'I kept the final call transparent about tradeoffs and confidence.',
      'You can adapt the pick quickly if your constraints change.',
    ],
  },
  local: {
    thinkingHeadings: ['Grounding In Local Context', 'Mapping Nearby Relevance', 'Adapting To Your Location'],
    streamingHeadings: ['Writing Location-Aware Guidance', 'Composing Localized Recommendations', 'Turning Context Into Local Answers'],
    doneHeadings: ['Local Guidance Ready', 'Location Review Complete', 'Contextual Answer Finalized'],
    statusVerbs: ['grounding context for', 'adapting locally for', 'checking nearby relevance for'],
    step1Hints: [
      'I am identifying which parts of the question depend on local conditions.',
      'I am mapping location-sensitive factors before drafting recommendations.',
      'I am distinguishing universal advice from context-specific guidance.',
    ],
    step2Hints: [
      'I am prioritizing sources that better reflect regional differences.',
      'I am checking constraints likely to change by city, country, or nearby options.',
      'I am filtering generic advice when local variability can change results.',
    ],
    step3Hints: [
      'I am tailoring the response to context while keeping fallback options clear.',
      'I am balancing local relevance with guidance that still generalizes when needed.',
      'I am shaping recommendations around what is realistic in nearby conditions.',
    ],
    streamingHints: [
      'I am keeping assumptions explicit so local differences stay visible.',
      'I am writing with place-specific context rather than generic defaults.',
      'I am emphasizing adaptable choices in case your exact location varies.',
    ],
    doneHints: [
      'The final answer is localized where it matters and flexible where it should be.',
      'I kept location assumptions clear so you can adjust quickly.',
      'You should now have guidance that feels contextual, not generic.',
    ],
  },
  general: {
    thinkingHeadings: ['Working Through Your Search', 'Mapping Your Search Intent', 'Building Your Answer Logic'],
    streamingHeadings: ['Writing Your Response', 'Composing The Final Draft', 'Turning Findings Into Answers'],
    doneHeadings: ['Answer Ready', 'Reasoning Pass Complete', 'Final Review Complete'],
    statusVerbs: ['drafting', 'refining', 'shaping'],
    step1Hints: [
      'I am narrowing this to the exact question behind your wording.',
      'I am setting the scope so the answer stays focused and useful.',
      'I am clarifying intent first so the response is precise.',
    ],
    step2Hints: [
      'I am prioritizing reliable details and filtering repetitive noise.',
      'I am collecting high-signal facts before writing the final wording.',
      'I am checking source quality before using any claim in the answer.',
    ],
    step3Hints: [
      'I am organizing the strongest findings into a direct response.',
      'I am shaping the evidence into a clear and readable answer.',
      'I am connecting facts into a concise explanation with practical value.',
    ],
    streamingHints: [
      'I am keeping this concise while preserving key context.',
      'I am balancing clarity and depth so the answer stays usable.',
      'I am emphasizing the points that matter most to your query.',
    ],
    doneHints: [
      'I kept the final response focused on your original intent.',
      'The answer stays clear, grounded, and easy to apply.',
      'I removed side noise so the important points stand out.',
    ],
  },
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
  const tone = INTENT_MICRO_TONES[intent]
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
  const step1Hint = pick(tone.step1Hints, 9)
  const step2Hint = pick(tone.step2Hints, 10)
  const step3Hint = pick(tone.step3Hints, 11)

  const headingSet = {
    thinking: pick(tone.thinkingHeadings, 0),
    streaming: pick(tone.streamingHeadings, 1),
    done: pick(tone.doneHeadings, 2),
  }

  const steps = [
    pick([
      `I'm mapping ${queryLabel} into the exact points that need evidence. ${step1Hint}`,
      `I'm breaking ${queryLabel} into focused sub-questions before writing. ${step1Hint}`,
      `I'm framing what ${queryLabel} is really asking so the answer stays on target. ${step1Hint}`,
    ], 3),
    pick([
      `I'm pulling high-signal sources around ${focusPhrase} and filtering repetitive noise. ${step2Hint}`,
      `I'm gathering reliable details on ${focusPhrase} and dropping weak matches. ${step2Hint}`,
      `I'm scanning multiple references on ${focusPhrase} before I draft your answer. ${step2Hint}`,
    ], 4),
    pick([
      `I'm connecting the findings into ${intentGoalMap[intent]} tailored to your query. ${step3Hint}`,
      `I'm shaping the evidence into ${intentGoalMap[intent]} that directly answers you. ${step3Hint}`,
      `I'm organizing the strongest points into ${intentGoalMap[intent]} without extra fluff. ${step3Hint}`,
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
      streaming: `${pick([
        `I'm drafting the final response for ${queryLabel} and keeping every point grounded in sources.`,
        `I'm now writing your answer for ${queryLabel}, keeping it concise and evidence-backed.`,
        `I'm turning the research on ${focusPhrase} into a clean response you can use immediately.`,
      ], 7)} ${pick(tone.streamingHints, 12)}`,
      done: `${pick([
        `I finished a final quality pass so this answer stays aligned with ${queryLabel}.`,
        `I completed the reasoning pass and kept only details that directly support ${queryLabel}.`,
        `I wrapped up with one more check so the response remains accurate and relevant to your search.`,
      ], 8)} ${pick(tone.doneHints, 13)}`,
    },
    statusText: `${pick(tone.statusVerbs, 14)} ${statusTopic}...`,
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
  const totalSteps = script.steps.length
  const heading = state === 'thinking'
    ? script.headings.thinking
    : state === 'streaming'
      ? script.headings.streaming
      : script.headings.done
  const thoughtText = state === 'done'
    ? script.steps[script.steps.length - 1]
    : script.steps[activeStep]
  const supportText = state === 'thinking'
    ? undefined
    : state === 'streaming'
      ? script.leads.streaming
      : script.leads.done

  // Gradient border color based on state
  const borderColor = state === 'thinking' 
    ? 'from-primary/20 via-primary/10 to-transparent'
    : state === 'streaming'
      ? 'from-primary/30 via-primary/15 to-transparent'
      : 'from-emerald-500/20 via-emerald-500/10 to-transparent'

  return (
    <motion.div 
      className="mb-3 rounded-lg sm:mb-4 sm:rounded-xl sm:px-4 sm:py-3.5 relative overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated gradient border */}
      <div className={`absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r ${borderColor} opacity-50`} />
      <div className="absolute inset-[1px] rounded-lg sm:rounded-xl bg-background/90 backdrop-blur-sm" />
      
      <div className="relative px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className="mt-[1px] flex h-4 w-4 items-center justify-center rounded-full border border-foreground/10">
            {state === 'thinking' || state === 'streaming' ? (
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
                {heading}
              </p>
              {/* Step counter */}
              {state === 'thinking' && (
                <span className="text-[9px] font-medium text-muted-foreground/50 tabular-nums">
                  {activeStep + 1}/{totalSteps}
                </span>
              )}
              {state === 'thinking' && (
                <span className="inline-flex rounded-full border border-primary/20 bg-primary/[0.05] px-2 py-0.5 text-[10px] font-medium text-primary/70">
                  <ShimmeringText text={script.statusText} duration={1.8} spread={1.25} />
                </span>
              )}
            </div>

            <div className="mt-1 min-h-[38px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={`${state}:${activeStep}:${thoughtText}`}
                  className="text-[11px] leading-relaxed text-foreground/82 sm:text-[12px]"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                >
                  {thoughtText}
                </motion.p>
              </AnimatePresence>
            </div>

            {supportText && (
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/75">
                {supportText}
              </p>
            )}

            {state === 'done' && content && (
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/70">
                {content}
              </p>
            )}
          </div>
        </div>
      </div>
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
    const delay = 880 + step * 180 + variance
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-500/[0.08] text-amber-600 dark:text-amber-400 border border-amber-500/15 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px]">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Cached</span>
        </span>
      )}
      
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px] ${tierStyle.className}`}>
        {tier}
      </span>
      
      <span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wide sm:text-[10px]">
        {cached ? 'via' : 'by'}{' '}
        <span className="text-foreground/60 font-semibold">{modelHuman}</span>
      </span>
      
      <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wide ml-auto flex items-center gap-1.5 sm:text-[10px]">
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
  const [runCycle, setRunCycle] = useState(0)
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

  const reasoningScript = useMemo(() => {
    return buildReasoningScript(requestKey, runCycle)
  }, [requestKey, runCycle])

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
    >
      <div className="relative">
        {/* Subtle background glow on streaming */}
        {state === 'streaming' && (
          <motion.div 
            className="absolute -inset-8 rounded-2xl pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
            }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        {/* Success glow on done */}
        {state === 'done' && (
          <motion.div 
            className="absolute -inset-8 rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'radial-gradient(ellipse at center, hsl(142 76% 36% / 0.08) 0%, transparent 70%)',
            }}
          />
        )}
        <div className="relative">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export type { StreamState }
