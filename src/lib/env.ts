import { z } from 'zod'
import { logger } from './logger'

/**
 * Environment Variables Validation Schema
 * 
 * Required:
 * - OPENROUTER_API_KEY or OPENROUTER_API_KEYS: OpenRouter API authentication
 * 
 * Optional:
 * - GOOGLE_SEARCH_API_KEY: Google Custom Search API key
 * - GOOGLE_SEARCH_CX: Google Custom Search engine ID
 * - SERPAPI_KEY: SerpAPI key for web search
 */
const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY must not be empty').optional(),
  OPENROUTER_API_KEYS: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  OLLAMA_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().optional(),
  OLLAMA_MODEL: z.string().optional(),
  EXA_API_KEY: z.string().optional(),
  EXA_ANSWER_MODEL: z.string().optional(),
  GOOGLE_SEARCH_API_KEY: z.string().optional(),
  GOOGLE_SEARCH_CX: z.string().optional(),
  SERPAPI_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

type EnvType = z.infer<typeof envSchema>

// MEDIUM PRIORITY: Export type for IDE support and refactoring safety
// Previously: EnvType was only internal, breaking IDE autocomplete
export type { EnvType }

/**
 * Parse OpenRouter key pool from single and comma/newline-delimited env vars.
 */
function parseOpenRouterApiKeys(primary?: string, pool?: string): string[] {
  const keys: string[] = []

  const single = primary?.trim()
  if (single) keys.push(single)

  if (pool) {
    for (const token of pool.split(/[\n,]/)) {
      const value = token.trim()
      if (value) keys.push(value)
    }
  }

  return [...new Set(keys)]
}

/**
 * Validate environment variables at startup
 * Logs missing required keys but doesn't fail during build (Vercel edge runtime handling)
 */
function validateEnv(): EnvType {
  const env = envSchema.safeParse({
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_API_KEYS: process.env.OPENROUTER_API_KEYS,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    OLLAMA_API_KEY: process.env.OLLAMA_API_KEY,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
    EXA_API_KEY: process.env.EXA_API_KEY,
    EXA_ANSWER_MODEL: process.env.EXA_ANSWER_MODEL,
    GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY,
    GOOGLE_SEARCH_CX: process.env.GOOGLE_SEARCH_CX,
    SERPAPI_KEY: process.env.SERPAPI_KEY,
    NODE_ENV: process.env.NODE_ENV,
  })

  if (!env.success) {
    const errors = env.error.flatten().fieldErrors
    logger.warn('Environment validation failed', { errors })
    if (process.env.NODE_ENV === 'production') {
      logger.error('Production environment validation failure', Object.keys(errors).join(', '))
    }
    return { NODE_ENV: 'development' }
  }

  const configuredKeys = parseOpenRouterApiKeys(env.data.OPENROUTER_API_KEY, env.data.OPENROUTER_API_KEYS)
  const llmProviders = [
    configuredKeys.length > 0,
    !!env.data?.OLLAMA_API_KEY,
    !!env.data?.EXA_API_KEY,
  ]
  if (llmProviders.every(configured => !configured)) {
    logger.warn('No LLM provider configured (OPENROUTER_API_KEY, OLLAMA_API_KEY or EXA_API_KEY); answers will be synthesized from search results only')
    if (process.env.NODE_ENV === 'production') {
      logger.error('Production environment validation failure', 'OPENROUTER_API_KEY, OLLAMA_API_KEY, EXA_API_KEY')
    }
  }

  return env.data
}

export const ENV = validateEnv()

const OPENROUTER_API_KEY_POOL = parseOpenRouterApiKeys(
  process.env.OPENROUTER_API_KEY,
  process.env.OPENROUTER_API_KEYS
)

export function getOpenRouterApiKeys(): string[] {
  return [...OPENROUTER_API_KEY_POOL]
}

/**
 * Helper to check if optional API keys are configured
 */
export const hasGoogleSearch = () => !!ENV.GOOGLE_SEARCH_API_KEY && !!ENV.GOOGLE_SEARCH_CX
export const hasSerpAPI = () => !!ENV.SERPAPI_KEY

export const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1').replace(/\/+$/, '')
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'beam:cloud'
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free'
export const EXA_ANSWER_MODEL = process.env.EXA_ANSWER_MODEL || 'exa-fast'

export function hasOllama(): boolean {
  return !!process.env.OLLAMA_API_KEY
}

export function hasExa(): boolean {
  return !!process.env.EXA_API_KEY
}

/**
 * True when at least one LLM answer provider is configured
 * (OpenRouter keys, Ollama Cloud key, or Exa key).
 */
export function hasAnyAnswerProvider(): boolean {
  return getOpenRouterApiKeys().length > 0 || hasOllama() || hasExa()
}
