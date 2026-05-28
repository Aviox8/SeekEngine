/**
 * Semantic Cache for AI Responses
 * 
 * Features:
 * - Normalizes queries to catch semantically similar questions
 * - In-memory cache with TTL (edge-safe)
 * - Returns cached answers instantly
 * - Stores full metadata for transparency
 * - Can be upgraded to Redis/Upstash KV later
 */

import { CACHE_TTL_MS, SEMANTIC_CACHE_MAX_ENTRIES } from './constants'

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣ CACHE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const TTL = CACHE_TTL_MS
const MAX_CACHE_SIZE = SEMANTIC_CACHE_MAX_ENTRIES

// ─────────────────────────────────────────────────────────────────────────────
// 2️⃣ CACHE TYPES
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// 3️⃣ IN-MEMORY CACHE STORE
// ─────────────────────────────────────────────────────────────────────────────

const cache = new Map<string, CacheEntry>()

// ─────────────────────────────────────────────────────────────────────────────
// 4️⃣ QUERY NORMALIZATION
// Converts queries to a canonical form to catch similar questions
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeQuery(query: string): string {
  // FIX: Too aggressive normalization was destroying query intent
  // Changed strategy: only normalize whitespace and case, preserve meaningful words
  return query
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[?!.,;:'"]/g, '')
    // FIXED: Removed overly aggressive filler word removal
    // This was removing important words like "do", "can", "what"
}

/**
 * Generate a cache key from a query
 * Uses normalized query + optional task type
 */
export function generateCacheKey(query: string, task?: string): string {
  const normalized = normalizeQuery(query)
  const taskPrefix = task ? `${task}:` : ''
  return `${taskPrefix}${normalized}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 5️⃣ CACHE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a cached answer if available and not expired
 */
export function getCachedAnswer(query: string, task?: string): CachedAnswer | null {
  const key = generateCacheKey(query, task)
  const entry = cache.get(key)
  
  if (!entry) {
    return null
  }
  
  // Check TTL
  const now = Date.now()
  if (now - entry.createdAt > TTL) {
    cache.delete(key)
    return null
  }
  
  // Update access stats
  entry.lastAccessedAt = now
  entry.hitCount++
  
  console.log(`📦 Cache HIT for: "${query.slice(0, 50)}..." (${entry.hitCount} hits)`)
  
  return entry.data
}

/**
 * Store an answer in the cache
 */
export function setCachedAnswer(
  query: string,
  answer: CachedAnswer,
  task?: string
): void {
  const key = generateCacheKey(query, task)
  const now = Date.now()
  
  // PERF: Batch eviction to avoid frequent eviction calls
  // When cache approaches limit, evict multiple old entries at once
  // This is more efficient than evicting one entry per write at capacity
  if (cache.size >= MAX_CACHE_SIZE) {
    // Evict 20% of entries to free up space
    const toEvict = Math.ceil(MAX_CACHE_SIZE * 0.2)
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt)
      .slice(0, toEvict)
    
    for (const [entryKey] of entries) {
      cache.delete(entryKey)
    }
    console.log(`🗑️ Batch evicted ${toEvict} entries (freed space for new entries)`)
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
  
  console.log(`💾 Cached answer for: "${query.slice(0, 50)}..."`)
}

/**
 * Check if a query has a valid cache entry (read-only, no side effects)
 */
export function hasCachedAnswer(query: string, task?: string): boolean {
  const key = generateCacheKey(query, task)
  const entry = cache.get(key)
  if (!entry) return false
  return Date.now() - entry.createdAt <= TTL
}

/**
 * Clear expired entries (can be called periodically)
 */
export function clearExpiredEntries(): number {
  const now = Date.now()
  let cleared = 0
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.createdAt > CACHE_TTL_MS) {
      cache.delete(key)
      cleared++
    }
  }
  
  if (cleared > 0) {
    console.log(`🧹 Cleared ${cleared} expired cache entries`)
  }
  
  return cleared
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  maxSize: number
  hitRate: number
  oldestEntry: number | null
} {
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

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  cache.clear()
  console.log('🧹 Cache cleared')
}

// ─────────────────────────────────────────────────────────────────────────────
// 6️⃣ SIMILARITY HELPERS (For Future Fuzzy Matching)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple word-based similarity score
 * Returns 0-1 where 1 is identical
 */
export function querySimilarity(query1: string, query2: string): number {
  const words1 = new Set(normalizeQuery(query1).split(' '))
  const words2 = new Set(normalizeQuery(query2).split(' '))
  
  if (words1.size === 0 || words2.size === 0) return 0
  
  let intersection = 0
  for (const word of words1) {
    if (words2.has(word)) intersection++
  }
  
  // Jaccard similarity
  const union = words1.size + words2.size - intersection
  return intersection / union
}

/**
 * Find similar cached queries (for fuzzy matching)
 * Returns entries with similarity above threshold
 */
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
  
  // Sort by similarity descending
  return results.sort((a, b) => b.similarity - a.similarity)
}
