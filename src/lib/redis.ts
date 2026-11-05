/**
 * Shared Upstash Redis (REST) client for cross-instance caches.
 *
 * Edge-runtime safe: talks over HTTPS (no TCP). When the env vars are absent
 * every consumer falls back to per-instance in-memory caches instead.
 *
 * Required env vars (set both, or neither):
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis'
import { logger } from './logger'

let client: Redis | null = null

export function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

export function getRedis(): Redis | null {
  if (!isRedisConfigured()) {
    return null
  }
  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return client
}

/** Namespaced key prefixes used across the codebase. */
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

export async function redisTry<T>(operation: string, fn: (redis: Redis) => Promise<T>): Promise<T | undefined> {
  const redis = getRedis()
  if (!redis) {
    return undefined
  }
  try {
    return await fn(redis)
  } catch (error) {
    logger.warn(`Redis ${operation} failed, falling back to local behaviour`, {
      reason: error instanceof Error ? error.message : String(error),
    })
    return undefined
  }
}
