/**
 * OpenRouter AI Configuration
 * Constants, policies, and static fallback models
 */

import { getOpenRouterApiKeys } from '../env'
import { logger } from '../logger'
import type { AITask, TaskPolicy, ModelTier } from './types'
import { AITask as AITaskEnum } from './types'
import {
  MODEL_CACHE_TTL_MS,
  MAX_MODEL_FAILURES_THRESHOLD,
  MAX_ANSWER_TOKENS,
  MAX_SUGGESTION_TOKENS,
  MAX_CODE_TOKENS,
} from '../constants'

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
export const MODELS_ENDPOINT = 'https://openrouter.ai/api/v1/models'
export const MAX_MODEL_FAILURES = MAX_MODEL_FAILURES_THRESHOLD
export const CACHE_TTL = MODEL_CACHE_TTL_MS

/**
 * Public site URL used for OpenRouter attribution headers.
 * Override with NEXT_PUBLIC_SITE_URL when deploying to another domain.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://seekengine.vercel.app'

export const BASE_SYSTEM_PROMPT = "You are SeekEngine AI. Concise markdown. Cite sources as [n]."

// Debug API Key presence (safe log — never prints the keys themselves)
if (process.env.NODE_ENV === 'development') {
  logger.debug(`OpenRouter API keys configured: ${getOpenRouterApiKeys().length}`)
}

export const TASK_POLICIES: Record<AITask, TaskPolicy> = {
  [AITaskEnum.SUGGESTIONS]: {
    temperature: 0.8,
    maxTokens: MAX_SUGGESTION_TOKENS,
    preferredTiers: ['fast', 'balanced'],
    maxLatency: 3500,
    globalTimeout: 7500,
  },
  [AITaskEnum.ANSWER]: {
    temperature: 0.35,
    maxTokens: MAX_ANSWER_TOKENS,
    preferredTiers: ['fast', 'balanced', 'heavy'],
    maxLatency: 6500,
    globalTimeout: 20000,
  },
  [AITaskEnum.CODE]: {
    temperature: 0.2,
    maxTokens: MAX_CODE_TOKENS,
    preferredTiers: ['code', 'balanced'],
    maxLatency: 7500,
    globalTimeout: 22000,
  },
}

export const MODEL_TIER_PATTERNS: Record<ModelTier, RegExp[]> = {
  fast: [
    /gemini.*flash/i,
    /gemma-3n/i,
    /gemma-3-4b/i,
    /llama-3\.2-3b/i,
    /nano/i,
    /3b-instruct/i,
    /qwen3-4b/i,
    /lfm-.*instruct/i,
    /glm-.*air/i,
  ],
  balanced: [
    /owl-alpha/i,
    /hy3-preview/i,
    /gemma-4-26b/i,
    /gemma-4-31b/i,
    /mistral.*small/i,
    /gemma-3-12b/i,
    /gemma-3-27b/i,
    /dolphin-mistral/i,
    /deepseek-chat/i,
    /nemotron-3-nano-omni/i,
    /nemotron-3-nano/i,
    /minimax-m2\.5/i,
  ],
  heavy: [
    /70b/i,
    /80b/i,
    /120b/i,
    /405b/i,
    /1t/i,
    /think/i,
    /hunter-alpha/i,
    /healer-alpha/i,
    /gpt-oss/i,
    /hermes.*405b/i,
    /nemotron-3-super/i,
    /qwen3-next/i,
    /ling-2\.6-1t/i,
  ],
  code: [
    /coder/i,
    /devstral/i,
    /deepseek.*code/i,
    /qwen.*coder/i,
    /codellama/i,
    /laguna/i,
  ],
}

/**
 * Emergency-only fallback models — used when the dynamic fetch fails.
 * 
 * MAINTENANCE INSTRUCTIONS:
 * 1. Visit: https://openrouter.ai/openrouter/free or https://openrouter.ai/models?max_price=0
 * 2. Filter free models with zero pricing (Prompt: $0.00, Completion: $0.00)
 * 3. Add new models to the appropriate tier:
 *    - fast: <5B params, 1-5B params (e.g., Gemma 3N, LLaMA 3.2 3B)
 *    - balanced: 8-50B params (e.g., Mistral Small, Gemma 3 12-27B)
 *    - heavy: 50B+ params (e.g., LLaMA 70B, Hermes 405B)
 *    - code: Optimized for code generation (e.g., Qwen Coder)
 * 4. Use model ID from OpenRouter (e.g., "meta-llama/llama-3.3-70b-instruct:free")
 * 5. Test in staging environment before deploying
 * 
 * Last Updated: 2026-05-02
 * Source: https://openrouter.ai/models?max_price=0&output_modalities=text
 * Total Models: 29 (8 fast, 10 balanced, 8 heavy, 3 code)
 */
export const STATIC_FALLBACK_MODELS: Record<ModelTier, string[]> = {
  fast: [
    'google/gemma-3n-e4b-it:free',
    'google/gemma-3n-e2b-it:free',
    'google/gemma-3-4b-it:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'nvidia/nemotron-nano-9b-v2:free',
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'liquid/lfm-2.5-1.2b-instruct:free',
    'z-ai/glm-4.5-air:free',
  ],
  
  balanced: [
    'openrouter/owl-alpha',
    'tencent/hy3-preview:free',
    'google/gemma-3-12b-it:free',
    'google/gemma-3-27b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'google/gemma-4-31b-it:free',
    'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    'minimax/minimax-m2.5:free',
  ],
  
  heavy: [
    'meta-llama/llama-3.3-70b-instruct:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'openai/gpt-oss-120b:free',
    'openai/gpt-oss-20b:free',
    'inclusionai/ling-2.6-1t:free',
    'liquid/lfm-2.5-1.2b-thinking:free',
  ],
  
  code: [
    'qwen/qwen3-coder:free',
    'poolside/laguna-xs.2:free',
    'poolside/laguna-m.1:free',
  ],
}

/**
 * Validate that fallback models are properly formatted
 * @throws Error if any model ID is invalid
 * @returns true if all models pass validation
 */
export function validateFallbackModels(): boolean {
  for (const [tier, models] of Object.entries(STATIC_FALLBACK_MODELS)) {
    if (!Array.isArray(models)) {
      throw new Error(`Invalid fallback models structure for tier: ${tier}`)
    }
    
    for (const model of models) {
      if (typeof model !== 'string') {
        throw new Error(`Invalid model type in tier ${tier}: expected string, got ${typeof model}`)
      }
      
      // Model ID must contain at least a provider (or be a special openrouter model)
      if (!model.includes('/') && !model.startsWith('openrouter/')) {
        throw new Error(`Invalid model format in tier ${tier}: "${model}" (expected "provider/model" or "openrouter/name")`)
      }
      
      // Warn if model doesn't have :free suffix (not strictly required for some models)
      if (!model.includes(':') && !model.startsWith('openrouter/')) {
        logger.warn(`Model "${model}" in tier ${tier} may not be free — consider adding ":free" suffix`)
      }
    }
  }
  
  return true
}

// Validate models at module load (fast-fail on bad config, not on every request)
try {
  validateFallbackModels()
  logger.debug(`Blueprint fallback models validated (${Object.values(STATIC_FALLBACK_MODELS).flat().length} total)`)
} catch (error) {
  logger.error('Fallback model validation failed', error instanceof Error ? error : new Error(String(error)))
}
