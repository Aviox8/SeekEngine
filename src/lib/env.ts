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
  if (configuredKeys.length === 0) {
    logger.warn('Environment validation failed', {
      errors: {
        OPENROUTER_API_KEY: ['Provide OPENROUTER_API_KEY or OPENROUTER_API_KEYS']
      }
    })
    if (process.env.NODE_ENV === 'production') {
      logger.error('Production environment validation failure', 'OPENROUTER_API_KEY, OPENROUTER_API_KEYS')
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
