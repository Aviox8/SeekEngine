/**
 * Shared Redis (Upstash REST) clients, backed by TWO providers:
 *
 * - Primary: Upstash (env UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
 * - Fallback/warm: any Upstash-compatible REST endpoint — e.g. Layerbase (env
 *   LAYERBASE_REDIS_REST_URL / LAYERBASE_REDIS_REST_TOKEN)
 *
 * Edge-runtime safe (HTTPS only, no TCP). When no backend is configured every
 * consumer falls back to per-instance in-memory caches.
 *
 * Semantics:
 * - 'read' ops: served from primary; on primary failure, served from fallback.
 * - 'write' ops: applied to BOTH backends (best effort) so the fallback does
 *   not drift behind. A primary failure still lets the fallback take the write.
 * - Fail-open everywhere: on total backend failure, callers get `undefined`
 *   and degrade to local behavior — Redis must never be the reason the site is down.
 */

import { Redis } from '@upstash/redis'
import { logger } from './logger'

let primary: Redis | null = null
let fallback: Redis | null = null

export function isRedisConfigured(): boolean {
  return !!(primaryEnv.url && primaryEnv.token) || !!(fallbackEnv.url && fallbackEnv.token)
}

const primaryEnv = {
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
}

const fallbackEnv = {
  url: process.env.LAYERBASE_REDIS_REST_URL,
  token: process.env.LAYERBASE_REDIS_REST_TOKEN,
}

export function getRedis(): Redis | null {
  if (!(primaryEnv.url && primaryEnv.token)) {
    return null
  }
  if (!primary) {
    primary = new Redis({ url: primaryEnv.url, token: primaryEnv.token })
  }
  return primary
}

export function getFallbackRedis(): Redis | null {
  if (!(fallbackEnv.url && fallbackEnv.token)) {
    return null
  }
  if (!fallback) {
    fallback = new Redis({ url: fallbackEnv.url, token: fallbackEnv.token })
  }
  return fallback
}

export const redisKeys = {
  rateLimit: (key: string) => `se:rl:${key}`,
  searchContext: (key: string) => `se:ctx:${key}`,
  answer: (key: string) => `se:ans:${key}`,
  suggestions: (key: string) => `se:sug:${key}`,
  stats: {
    answerHits: 'se:stats:answer:hits',
    answerMisses: 'se:stats:answer:misses',
    answerWrites: 'se:stats:answer:writes',
  },
} as const

export type RedisTryKind = 'read' | 'write'

export async function redisTry<T>(
  operation: string,
  fn: (redis: Redis) => Promise<T>,
  kind: RedisTryKind = 'read'
): Promise<T | undefined> {
  const p = getRedis()
  const f = getFallbackRedis()

  if (kind === 'write') {
    // Best effort on both backends so the fallback does not drift behind
    let result: T | undefined
    if (p) {
      try {
        result = await fn(p)
      } catch (error) {
        logger.warn(`Redis ${operation} failed on primary`, {
          reason: error instanceof Error ? error.message : String(error),
        })
      }
    }
    if (f) {
      try {
        const fallbackResult = await fn(f)
        if (result === undefined) result = fallbackResult
      } catch (error) {
        logger.warn(`Redis ${operation} failed on fallback`, {
          reason: error instanceof Error ? error.message : String(error),
        })
      }
    }
    return result
  }

  // read: primary first, fallback on failure
  if (p) {
    try {
      return await fn(p)
    } catch (error) {
      logger.warn(`Redis ${operation} failed on primary, trying fallback`, {
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }
  if (f) {
    try {
      return await fn(f)
    } catch (error) {
      logger.warn(`Redis ${operation} failed on fallback`, {
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return undefined
}

export async function warmRedis(): Promise<{
  primary: 'pong' | 'unavailable' | 'unconfigured'
  fallback: 'pong' | 'unavailable' | 'unconfigured'
}> {
  const p = getRedis()
  const f = getFallbackRedis()

  const ping = async (client: Redis | null): Promise<'pong' | 'unavailable' | 'unconfigured'> => {
    if (!client) return 'unconfigured'
    try {
      await client.ping()
      return 'pong'
    } catch {
      return 'unavailable'
    }
  }

  const [primaryStatus, fallbackStatus] = await Promise.all([ping(p), ping(f)])
  return { primary: primaryStatus, fallback: fallbackStatus }
}
