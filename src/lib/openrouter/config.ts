/**
 * OpenRouter AI Configuration
 * Constants, policies, and static fallback models
 */

import { ENV } from '../env'
import type { AITask, TaskPolicy, ModelTier } from './types'
import { AITask as AITaskEnum } from './types'
import { MODEL_CACHE_TTL_MS, MAX_MODEL_FAILURES_THRESHOLD } from '../constants'

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
export const MODELS_ENDPOINT = 'https://openrouter.ai/api/v1/models'
export const MAX_MODEL_FAILURES = MAX_MODEL_FAILURES_THRESHOLD
export const CACHE_TTL = MODEL_CACHE_TTL_MS

export const BASE_SYSTEM_PROMPT = "You are SeekEngine AI. Concise markdown. Cite sources as [n]."

// Debug API Key presence (safe log — development only)
if (process.env.NODE_ENV === 'development') {
  console.log(`🔑 OpenRouter API Key Present: ${!!ENV.OPENROUTER_API_KEY}`)
}

export const TASK_POLICIES: Record<AITask, TaskPolicy> = {
  [AITaskEnum.SUGGESTIONS]: {
    temperature: 0.8,
    maxTokens: 200,
    preferredTiers: ['fast', 'balanced'],
    maxLatency: 3000,
    globalTimeout: 6000,
  },
  [AITaskEnum.ANSWER]: {
    temperature: 0.35,
    maxTokens: 800,
    preferredTiers: ['fast', 'balanced', 'heavy'],
    maxLatency: 5000,
    globalTimeout: 12000,
  },
  [AITaskEnum.CODE]: {
    temperature: 0.2,
    maxTokens: 1200,
    preferredTiers: ['code', 'balanced'],
    maxLatency: 6000,
    globalTimeout: 15000,
  },
}

export const MODEL_TIER_PATTERNS: Record<ModelTier, RegExp[]> = {
  fast: [
    /gemini.*flash/i,
    /gemma-3n/i,
    /gemma-3-4b/i,
    /nano/i,
    /3b-instruct/i,
    /qwen3-4b/i,
    /trinity-mini/i,
    /lfm-.*instruct/i,
    /step-.*flash/i,
    /glm-.*air/i,
  ],
  balanced: [
    /mistral.*small/i,
    /gemma-3-12b/i,
    /gemma-3-27b/i,
    /dolphin-mistral/i,
    /devstral/i,
    /deepseek-chat/i,
  ],
  heavy: [
    /70b/i,
    /80b/i,
    /120b/i,
    /405b/i,
    /think/i,
    /trinity-large/i,
    /hunter-alpha/i,
    /healer-alpha/i,
    /gpt-oss/i,
    /hermes.*405b/i,
    /nemotron-3-super/i,
    /qwen3-next/i,
  ],
  code: [
    /coder/i,
    /devstral/i,
    /deepseek.*code/i,
    /qwen.*coder/i,
    /codellama/i,
  ],
}

// Emergency-only fallback — used when the dynamic fetch fails.
// Keep synced with https://openrouter.ai/models?max_price=0
export const STATIC_FALLBACK_MODELS: Record<ModelTier, string[]> = {
  fast: [
    'google/gemma-3n-e4b-it:free',
    'google/gemma-3n-e2b-it:free',
    'google/gemma-3-4b-it:free',
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'nvidia/nemotron-nano-9b-v2:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'qwen/qwen3-4b:free',
    'arcee-ai/trinity-mini:free',
    'stepfun/step-3.5-flash:free',
    'liquid/lfm-2.5-1.2b-instruct:free',
    'z-ai/glm-4.5-air:free',
  ],
  balanced: [
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'google/gemma-3-12b-it:free',
    'google/gemma-3-27b-it:free',
    'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  ],
  heavy: [
    'meta-llama/llama-3.3-70b-instruct:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'openai/gpt-oss-120b:free',
    'openai/gpt-oss-20b:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'arcee-ai/trinity-large-preview:free',
    'openrouter/hunter-alpha',
    'openrouter/healer-alpha',
    'liquid/lfm-2.5-1.2b-thinking:free',
  ],
  code: [
    'qwen/qwen3-coder:free',
  ],
}
