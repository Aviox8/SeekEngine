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
    maxLatency: 3500,
    globalTimeout: 7500,
  },
  [AITaskEnum.ANSWER]: {
    temperature: 0.35,
    maxTokens: 800,
    preferredTiers: ['fast', 'balanced', 'heavy'],
    maxLatency: 6500,
    globalTimeout: 20000,
  },
  [AITaskEnum.CODE]: {
    temperature: 0.2,
    maxTokens: 1200,
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
 * Last Updated: 2026-03-27
 * Total Models: 25 (12 fast, 4 balanced, 8 heavy, 1 code)
 */
export const STATIC_FALLBACK_MODELS: Record<ModelTier, string[]> = {
  fast: [
    // Google Gemma: Ultra-fast 2-4B parameter models
    'google/gemma-3n-e4b-it:free',        // Gemma 3N 4B — Best speed/quality balance for fast tier
    'google/gemma-3n-e2b-it:free',        // Gemma 3N 2B — Smallest, near instant  
    'google/gemma-3-4b-it:free',          // Gemma 3 4B — Higher quality than 3N, still very fast
    
    // NVIDIA Nemotron: Efficient small models
    'nvidia/nemotron-nano-12b-v2-vl:free',  // Nemotron Nano 12B VL — Lightweight multimodal
    'nvidia/nemotron-nano-9b-v2:free',      // Nemotron Nano 9B — Small but capable
    'nvidia/nemotron-3-nano-30b-a3b:free',  // Nemotron 3 Nano 30B — Larger fast model, good quality
    
    // Meta LLaMA: Open foundation models
    'meta-llama/llama-3.2-3b-instruct:free', // LLaMA 3.2 3B — Tiny but surprisingly good
    
    // Qwen: Alibaba's efficient models
    'qwen/qwen3-4b:free',                   // Qwen3 4B — Fast Mandarin/English model
    
    // Specialized fast models
    'arcee-ai/trinity-mini:free',           // Trinity Mini — Optimized for speed
    'stepfun/step-3.5-flash:free',          // Step 3.5 Flash — StepFun's quick model
    'liquid/lfm-2.5-1.2b-instruct:free',    // LFM 2.5 1.2B — Extremely lightweight
    'z-ai/glm-4.5-air:free',                // GLM 4.5 Air — Compact Chinese variant
  ],
  
  balanced: [
    // Mistral: Strong mid-size performers
    'mistralai/mistral-small-3.1-24b-instruct:free', // Mistral Small 24B — Best balanced choice
    
    // Google Gemma: Mid-size instruction models
    'google/gemma-3-12b-it:free',           // Gemma 3 12B — Good quality, still responsive
    'google/gemma-3-27b-it:free',           // Gemma 3 27B — High quality responses, slightly slower
    
    // Cognitive Computations: Mistral variant
    'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', // Dolphin Mistral — Great for creative/long-form
  ],
  
  heavy: [
    // Meta LLaMA: Large foundation models
    'meta-llama/llama-3.3-70b-instruct:free',        // LLaMA 3.3 70B — Strong general-purpose large model
    
    // NousResearch: State-of-the-art variants
    'nousresearch/hermes-3-llama-3.1-405b:free',     // Hermes 3 LLaMA 405B — Extremely capable reasoning
    
    // NVIDIA Nemotron: High-capability models
    'nvidia/nemotron-3-super-120b-a12b:free',        // Nemotron 3 Super 120B — Complex task specialist
    
    // OpenAI: GPT-OSS series (open weights)
    'openai/gpt-oss-120b:free',                       // GPT-OSS 120B — Strong general performance
    'openai/gpt-oss-20b:free',                        // GPT-OSS 20B — Lighter heavy-tier option
    
    // Qwen: Large advanced model
    'qwen/qwen3-next-80b-a3b-instruct:free',         // Qwen3 Next 80B — Advanced reasoning capabilities
    
    // Arcee: Specialized large model
    'arcee-ai/trinity-large-preview:free',           // Trinity Large — Premium performance tier
    
    // Liquid: Reasoning-enhanced model
    'liquid/lfm-2.5-1.2b-thinking:free',             // LFM 2.5 1.2B Thinking — Extended reasoning with token budget
  ],
  
  code: [
    // Qwen: Code-optimized model
    'qwen/qwen3-coder:free', // Qwen3 Coder — Specialized for programming tasks
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
        console.warn(`Model "${model}" in tier ${tier} may not be free — consider adding ":free" suffix`)
      }
    }
    
    console.log(`✓ Validated tier ${tier}: ${models.length} models`)
  }
  
  return true
}

// Validate models at module load
try {
  validateFallbackModels()
  console.log(`✓ All ${Object.values(STATIC_FALLBACK_MODELS).flat().length} fallback models validated`)
} catch (error) {
  console.error(`❌ Fallback model validation failed:`, error)
}
