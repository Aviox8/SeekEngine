/**
 * OpenRouter Model Management
 * Model classification, health tracking, fetching, and task-aware selection
 */

import type { ModelTier, OpenRouterModel, AITask, TelemetryEvent } from './types'
import { logger } from '../logger'
import {
  MODEL_TIER_PATTERNS,
  MODELS_ENDPOINT,
  STATIC_FALLBACK_MODELS,
  CACHE_TTL,
  TASK_POLICIES,
} from './config'
import { MODEL_FAILURE_RECOVERY_WINDOW_MS } from '../constants'

// ── Model Name Registry ──────────────────────────────────────────────────────
/**
 * Map of model ID patterns to human-readable names
 * Ordered from most specific to least specific for accurate matching
 */
const MODEL_NAME_REGISTRY = [
  // Google Gemma models
  { pattern: /gemma-3n-e2b/i, name: 'Gemma 3N 2B' },
  { pattern: /gemma-3n-e4b/i, name: 'Gemma 3N 4B' },
  { pattern: /gemma-4-26b-a4b/i, name: 'Gemma 4 26B A4B' },
  { pattern: /gemma-4-31b/i, name: 'Gemma 4 31B' },
  { pattern: /gemma-3-27b/i, name: 'Gemma 3 27B' },
  { pattern: /gemma-3-12b/i, name: 'Gemma 3 12B' },
  { pattern: /gemma-3-4b/i, name: 'Gemma 3 4B' },
  { pattern: /gemma-3n/i, name: 'Gemma 3N' },
  { pattern: /gemma/i, name: 'Gemma' },
  { pattern: /gemini/i, name: 'Gemini' },
  
  // Meta LLaMA models
  { pattern: /llama-3\.3-70b/i, name: 'LLaMA 3.3 70B' },
  { pattern: /llama-3\.2-3b/i, name: 'LLaMA 3.2 3B' },
  { pattern: /llama-3\.1-405b/i, name: 'LLaMA 3.1 405B' },
  { pattern: /llama/i, name: 'LLaMA' },
  
  // Mistral models
  { pattern: /dolphin-mistral/i, name: 'Dolphin Mistral' },
  { pattern: /mistral-small/i, name: 'Mistral Small' },
  { pattern: /devstral/i, name: 'Devstral' },
  { pattern: /mistral/i, name: 'Mistral' },
  
  // Qwen models
  { pattern: /qwen3-coder/i, name: 'Qwen3 Coder' },
  { pattern: /qwen3-next-80b/i, name: 'Qwen3 Next 80B' },
  { pattern: /qwen3-4b/i, name: 'Qwen3 4B' },
  { pattern: /qwen/i, name: 'Qwen' },

  // Poolside models
  { pattern: /laguna-xs\.?2/i, name: 'Laguna XS.2' },
  { pattern: /laguna-m\.?1/i, name: 'Laguna M.1' },
  
  // DeepSeek models
  { pattern: /deepseek-r1/i, name: 'DeepSeek R1' },
  { pattern: /deepseek-chat/i, name: 'DeepSeek Chat' },
  { pattern: /deepseek/i, name: 'DeepSeek' },
  
  // NVIDIA Nemotron models
  { pattern: /nemotron-3-super/i, name: 'Nemotron 3 Super' },
  { pattern: /nemotron-3-nano-omni/i, name: 'Nemotron 3 Nano Omni' },
  { pattern: /nemotron-3-nano/i, name: 'Nemotron 3 Nano' },
  { pattern: /nemotron-nano/i, name: 'Nemotron Nano' },
  { pattern: /nemotron/i, name: 'Nemotron' },
  
  // StepFun models
  { pattern: /step-3\.5-flash/i, name: 'Step 3.5 Flash' },
  
  // Liquid models
  { pattern: /lfm-2\.5.*thinking/i, name: 'LFM 2.5 Thinking' },
  { pattern: /lfm-2\.5/i, name: 'LFM 2.5' },
  
  // OpenRouter models
  { pattern: /hunter-alpha/i, name: 'Hunter Alpha' },
  { pattern: /healer-alpha/i, name: 'Healer Alpha' },
  { pattern: /owl-alpha/i, name: 'Owl Alpha' },
  
  // Other notable models
  { pattern: /hermes.*405b/i, name: 'Hermes 405B' },
  { pattern: /ling-2\.6-1t/i, name: 'Ling 2.6 1T' },
  { pattern: /hy3-preview/i, name: 'Hy3 Preview' },
  { pattern: /minimax-m2\.5/i, name: 'MiniMax M2.5' },
  { pattern: /trinity-large/i, name: 'Trinity Large' },
  { pattern: /trinity/i, name: 'Trinity' },
  { pattern: /gpt-oss-120b/i, name: 'GPT-OSS 120B' },
  { pattern: /gpt-oss/i, name: 'GPT-OSS' },
  { pattern: /glm-4\.5/i, name: 'GLM 4.5' },
] as const

// ── Human-Friendly Model Name Mapper ─────────────────────────────────────────
/**
 * Convert OpenRouter model ID to human-readable name
 * Uses registry for efficient, maintainable lookups
 */
export function humanizeModel(model: string): string {
  if (!model) return 'Unknown Model'

  // Check registry first (most specific patterns first)
  for (const entry of MODEL_NAME_REGISTRY) {
    if (entry.pattern.test(model)) {
      return entry.name
    }
  }

  // Fallback: extract provider/model name from ID (e.g., "openai/gpt-4" -> "GPT 4")
  const parts = model.split('/')
  if (parts.length === 2) {
    return parts[1]
      .replace(/:free$/, '') // Remove :free suffix
      .replace(/-/g, ' ')     // Replace hyphens with spaces
      .replace(/\b\w/g, char => char.toUpperCase()) // Title case
  }

  return model
}

// ── Model Tier Classification ────────────────────────────────────────────────
/**
 * Determine the performance tier of a model
 * @param modelId - OpenRouter model ID
 * @returns ModelTier classification (fast, balanced, heavy, code)
 */
export function classifyModel(modelId: string): ModelTier {
  const id = modelId.replace(/:free$/, '').toLowerCase()
  
  if (MODEL_TIER_PATTERNS.code.some(p => p.test(id))) return 'code'
  if (MODEL_TIER_PATTERNS.fast.some(p => p.test(id))) return 'fast'
  if (MODEL_TIER_PATTERNS.balanced.some(p => p.test(id))) return 'balanced'
  if (MODEL_TIER_PATTERNS.heavy.some(p => p.test(id))) return 'heavy'
  
  return 'balanced'
}

// ── Filter Logic ─────────────────────────────────────────────────────────────

function isFree(model: OpenRouterModel): boolean {
  const pricing = model.pricing
  if (!pricing) return false
  const prompt = Number(pricing.prompt)
  const completion = Number(pricing.completion)
  return prompt === 0 && completion === 0
}

function supportsText(model: OpenRouterModel): boolean {
  const outputModalities = model.architecture?.output_modalities ?? []
  return outputModalities.length === 1 && outputModalities[0] === 'text'
}

function acceptsTextInput(model: OpenRouterModel): boolean {
  return model.architecture?.input_modalities?.includes('text') ?? false
}

/** Filter out meta-routers (e.g. openrouter/free) that would cause double-routing */
const EXCLUDED_MODEL_IDS = new Set(['openrouter/free'])
const EXCLUDED_MODEL_PATTERNS = [
  /ocr/i,
] as const

function isUsableModel(model: OpenRouterModel): boolean {
  return !EXCLUDED_MODEL_IDS.has(model.id) && !EXCLUDED_MODEL_PATTERNS.some((pattern) => pattern.test(model.id))
}

// ── Model Health Memory ──────────────────────────────────────────────────────
/**
 * Track model failures with timestamps for intelligent recovery
 * Map: model ID -> { failures: count, lastFailedAt: timestamp }
 * Allows distinguishing between old failures and recent systemic issues
 */
type ModelFailureInfo = {
  failures: number
  lastFailedAt: number
}

export const modelFailures = new Map<string, ModelFailureInfo>()

function pruneStaleModelFailures(now = Date.now()): void {
  for (const [model, info] of modelFailures.entries()) {
    if (now - info.lastFailedAt >= MODEL_FAILURE_RECOVERY_WINDOW_MS) {
      modelFailures.delete(model)
    }
  }
}

// ── Telemetry ────────────────────────────────────────────────────────────────
/**
 * Log model performance metrics
 * @param event - TelemetryEvent with model performance data
 */
export function logTelemetry(event: TelemetryEvent): void {
  const emoji = event.success ? '✅' : '❌'
  logger.info(`${emoji} [${event.task.toUpperCase()}] ${event.model}`, {
    tier: event.tier,
    latencyMs: event.latency,
    success: event.success,
    error: event.error || undefined,
  })
}

// ── Model Cache (Edge-Safe, In-Memory) ───────────────────────────────────────

let cachedModels: Record<ModelTier, string[]> | null = null
let lastFetchTime = 0

/**
 * Fetch and cache models from OpenRouter API
 * Falls back to static list if API fetch fails
 * @returns Map of model tiers to model IDs
 */
export async function getModelsByTier(): Promise<Record<ModelTier, string[]>> {
  const now = Date.now()

  // Return cached models if still fresh
  if (cachedModels && now - lastFetchTime < CACHE_TTL) {
    return cachedModels
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(MODELS_ENDPOINT, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) throw new Error(`Models fetch failed: ${res.status}`)

    const data = await res.json()
    const models: OpenRouterModel[] = data?.data ?? []
    logger.debug(`Fetched ${models.length} raw models from OpenRouter`)

    const freeTextModels = models
      .filter(isFree)
      .filter(acceptsTextInput)
      .filter(supportsText)
      .filter(isUsableModel)
    logger.debug(`Found ${freeTextModels.length} free text-capable models`)

    const tieredModels: Record<ModelTier, string[]> = {
      fast: [],
      balanced: [],
      heavy: [],
      code: [],
    }

    // Classify each model by tier
    for (const model of freeTextModels) {
      const tier = classifyModel(model.id)
      tieredModels[tier].push(model.id)
    }

    // Shuffle models within each tier using Fisher-Yates for unbiased distribution
    for (const tier of Object.keys(tieredModels) as ModelTier[]) {
      const arr = tieredModels[tier]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
    }

    cachedModels = tieredModels
    lastFetchTime = now

    const totalCount = Object.values(tieredModels).flat().length
    logger.info(`Loaded ${totalCount} free models across ${Object.keys(tieredModels).length} tiers`)

    return tieredModels
  } catch (err) {
    logger.warn(`Failed to fetch models from OpenRouter: ${(err as Error).message}. Using static fallback.`)
    return STATIC_FALLBACK_MODELS
  }
}

// ── Task-Aware Model Selector ────────────────────────────────────────────────
/**
 * Get models ordered by preference for a specific task
 * Prioritizes preferred tiers, then sorts by health (failure count)
 * @param task - AI task type (ANSWER, SUGGESTIONS, CODE)
 * @returns Array of model IDs ordered by preference
 */
export async function getModelsForTask(task: AITask): Promise<string[]> {
  // Recover models that have been healthy for long enough.
  pruneStaleModelFailures()

  const policy = TASK_POLICIES[task]
  const tieredModels = await getModelsByTier()

  const orderedModels: string[] = []

  // Add models from preferred tiers first
  for (const tier of policy.preferredTiers) {
    orderedModels.push(...(tieredModels[tier] || []))
  }

  // Add remaining models from other tiers
  for (const tier of ['fast', 'balanced', 'heavy', 'code'] as ModelTier[]) {
    if (!policy.preferredTiers.includes(tier)) {
      orderedModels.push(...(tieredModels[tier] || []))
    }
  }

  // Remove duplicates
  const uniqueModels = [...new Set(orderedModels)]
  
  // Sort by health (models with fewer failures first)
  uniqueModels.sort((a, b) => {
    const failureA = modelFailures.get(a)
    const failureB = modelFailures.get(b)
    const failCountA = failureA?.failures || 0
    const failCountB = failureB?.failures || 0
    return (failCountA - failCountB) || (Math.random() - 0.5)
  })

  return uniqueModels
}
