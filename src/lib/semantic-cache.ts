/**
 * Semantic Cache for AI Responses
 *
 * Two backends:
 * - Upstash Redis (REST, edge-safe) when UPSTASH_REDIS_REST_URL/TOKEN are set —
 *   shared across all instances so cached answers hit anywhere.
 * - In-memory Map otherwise (per-instance only).
 *
 * - Normalizes queries to catch semantically similar questions
 * - Returns cached answers instantly
 * - Stores full metadata for transparency
 * - Can be upgraded to Redis persistence later
 */

import { CACHE_TTL_MS, SEMANTIC_CACHE_MAX_ENTRIES } from './constants'
import { logger } from './logger'
import { isRedisConfigured, redisKeys, redisTry } from './redis'

const TTL = CACHE_TTL_MS
const MAX_CACHE_SIZE = SEMANTIC_CACHE_MAX_ENTRIES
const TTL_SECONDS = Math.floor(TTL / 1000)

export interface CachedAnswer {
  answer: string
  model: string
  modelHuman: string
  tier: string
  latencyMs: number
  attempts: number
  cachedAt: number
  originalQuery: string
}

interface CacheEntry {
  data: CachedAnswer
  createdAt: number
  lastAccessedAt: number
  hitCount: number
}

const cache = new Map<string, CacheEntry>()

export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[?!.,;:'"]/g, '')
}

export function generateCacheKey(query: string, task?: string): string {
  const normalized = normalizeQuery(query)
  const taskPrefix = task ? `${task}:` : ''
  return `${taskPrefix}${normalized}`
}

export async function getCachedAnswer(query: string, task?: string): Promise<CachedAnswer | null> {
  const key = generateCacheKey(query, task)
  if (isRedisConfigured()) {
    const cached = await redisTry<CachedAnswer | null>('get', async (r) => {
      const raw = await r.get<CachedAnswer>(redisKeys.answer(key))
      if (!raw) {
        await r.incr(redisKeys.stats.answerMisses)
        return null
      }
      await r.incr(redisKeys.stats.answerHits)
      return raw
    })
    // On Redis failure we deliberately miss rather than misread stale local state
    return cached ?? null
  }

  const entry = cache.get(key)
  if (!entry) {
    return null
  }

  const now = Date.now()
  if (now - entry.createdAt > TTL) {
    cache.delete(key)
    return null
  }

  entry.lastAccessedAt = now
  entry.hitCount++

  logger.debug(`Cache HIT for: "${query.slice(0, 50)}"`, { hits: entry.hitCount })

  return entry.data
}

export async function setCachedAnswer(
  query: string,
  answer: CachedAnswer,
  task?: string
): Promise<void> {
  const key = generateCacheKey(query, task)
  const now = Date.now()

  if (isRedisConfigured()) {
    const write = await redisTry('set', async (r) => {
      await r.set(redisKeys.answer(key), { ...answer, cachedAt: now, originalQuery: query }, { ex: TTL_SECONDS })
      await r.incr(redisKeys.stats.answerWrites)
      return true
    }, 'write')
    if (write) {
      logger.debug(`Cached answer for: "${query.slice(0, 50)}"`)
    }
    return
  }

  // PERF: Batch eviction to avoid frequent eviction calls
  if (cache.size >= MAX_CACHE_SIZE) {
    const toEvict = Math.ceil(MAX_CACHE_SIZE * 0.2)
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt)
      .slice(0, toEvict)

    for (const [entryKey] of entries) {
      cache.delete(entryKey)
    }
    logger.debug(`Batch evicted ${toEvict} cache entries`)
  }

  cache.set(key, {
    data: {
      ...answer,
      cachedAt: now,
      originalQuery: query,
    },
    createdAt: now,
    lastAccessedAt: now,
    hitCount: 0,
  })

  logger.debug(`Cached answer for: "${query.slice(0, 50)}"`)
}

export async function hasCachedAnswer(query: string, task?: string): Promise<boolean> {
  const key = generateCacheKey(query, task)

  if (isRedisConfigured()) {
    const found = await redisTry<boolean>('exists', async (r) => {
      const exists = await r.exists(redisKeys.answer(key))
      return exists === 1
    })
    return found ?? false
  }

  const entry = cache.get(key)
  if (!entry) return false
  return Date.now() - entry.createdAt <= TTL
}

export async function clearExpiredEntries(): Promise<number> {
  // Redis expires entries automatically via TTL
  if (isRedisConfigured()) {
    return 0
  }

  const now = Date.now()
  let cleared = 0

  for (const [key, entry] of cache.entries()) {
    if (now - entry.createdAt > CACHE_TTL_MS) {
      cache.delete(key)
      cleared++
    }
  }

  if (cleared > 0) {
    logger.debug(`Cleared ${cleared} expired cache entries`)
  }

  return cleared
}

export interface CacheStats {
  size: number
  maxSize: number
  hitRate: number
  oldestEntry: number | null
}

export async function getCacheStats(): Promise<CacheStats> {
  const EMPTY: CacheStats = { size: 0, maxSize: MAX_CACHE_SIZE, hitRate: 0, oldestEntry: null }

  if (isRedisConfigured()) {
    const stats = await redisTry<CacheStats>('stats', async (r) => {
      const keys = await r.keys('se:ans:*')
      const hits = Number((await r.get<string | number>(redisKeys.stats.answerHits)) ?? 0)
      const misses = Number((await r.get<string | number>(redisKeys.stats.answerMisses)) ?? 0)
      const total = hits + misses
      return {
        size: keys.length,
        maxSize: MAX_CACHE_SIZE,
        hitRate: total > 0 ? hits / total : 0,
        oldestEntry: null,
      }
    })
    return stats ?? EMPTY
  }

  let totalHits = 0
  let oldestTime = Infinity

  for (const entry of cache.values()) {
    totalHits += entry.hitCount
    if (entry.createdAt < oldestTime) {
      oldestTime = entry.createdAt
    }
  }

  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    hitRate: cache.size > 0 ? totalHits / cache.size : 0,
    oldestEntry: oldestTime === Infinity ? null : oldestTime,
  }
}

export async function clearCache(): Promise<void> {
  if (isRedisConfigured()) {
    await redisTry('clear', async (r) => {
      const keys = await r.keys('se:ans:*')
      if (keys.length > 0) {
        await r.del(...keys)
      }
      await r.del(redisKeys.stats.answerHits, redisKeys.stats.answerMisses, redisKeys.stats.answerWrites)
      return true
    }, 'write')
    logger.debug('Cache cleared')
    return
  }

  cache.clear()
  logger.debug('Cache cleared')
}

export function querySimilarity(query1: string, query2: string): number {
  const words1 = new Set(normalizeQuery(query1).split(' '))
  const words2 = new Set(normalizeQuery(query2).split(' '))

  if (words1.size === 0 || words2.size === 0) return 0

  let intersection = 0
  for (const word of words1) {
    if (words2.has(word)) intersection++
  }

  const union = words1.size + words2.size - intersection
  return intersection / union
}

export function findSimilarCachedQueries(
  query: string,
  threshold = 0.7
): Array<{ query: string; similarity: number; answer: CachedAnswer }> {
  const results: Array<{ query: string; similarity: number; answer: CachedAnswer }> = []

  for (const entry of cache.values()) {
    const similarity = querySimilarity(query, entry.data.originalQuery)
    if (similarity >= threshold) {
      results.push({
        query: entry.data.originalQuery,
        similarity,
        answer: entry.data,
      })
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity)
}
