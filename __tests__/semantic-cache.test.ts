import { describe, it, expect, beforeEach } from 'vitest'
import {
  normalizeQuery,
  generateCacheKey,
  getCachedAnswer,
  setCachedAnswer,
  clearCache,
  querySimilarity,
  getCacheStats,
  type CachedAnswer,
} from '../src/lib/semantic-cache'

describe('normalizeQuery', () => {
  it('lowercases and trims', () => {
    expect(normalizeQuery('  Hello World  ')).toBe('hello world')
  })

  it('collapses whitespace', () => {
    expect(normalizeQuery('hello   world')).toBe('hello world')
  })

  it('removes punctuation', () => {
    expect(normalizeQuery('hello? world! foo.')).toBe('hello world foo')
  })

  it('preserves structural words that affect intent', () => {
    expect(normalizeQuery('can you explain the concept')).toBe('can you explain the concept')
  })

  it('preserves question-intent words', () => {
    const result = normalizeQuery('how does quantum computing work')
    expect(result).toContain('how')
    expect(result).toContain('quantum')
    expect(result).toContain('computing')
    expect(result).toContain('work')
  })
})

describe('generateCacheKey', () => {
  it('returns normalized query as key', () => {
    const key = generateCacheKey('Hello World')
    expect(key).toBe('hello world')
  })

  it('adds task prefix when provided', () => {
    const key = generateCacheKey('Hello World', 'stream')
    expect(key).toBe('stream:hello world')
  })
})

describe('cache operations', () => {
  const mockEntry: CachedAnswer = {
    answer: 'Test answer',
    model: 'test-model',
    modelHuman: 'Test Model',
    tier: 'balanced',
    latencyMs: 100,
    attempts: 1,
    cachedAt: Date.now(),
    originalQuery: 'test query',
  }

  beforeEach(() => {
    clearCache()
  })

  it('returns null for cache miss', () => {
    expect(getCachedAnswer('nonexistent')).toBeNull()
  })

  it('stores and retrieves cached answer', () => {
    setCachedAnswer('test query', mockEntry)
    const result = getCachedAnswer('test query')
    expect(result).not.toBeNull()
    expect(result!.answer).toBe('Test answer')
  })

  it('matches normalized queries', () => {
    setCachedAnswer('Hello World', mockEntry)
    const result = getCachedAnswer('  hello   world  ')
    expect(result).not.toBeNull()
  })

  it('tracks cache stats', () => {
    setCachedAnswer('q1', mockEntry)
    setCachedAnswer('q2', mockEntry)
    const stats = getCacheStats()
    expect(stats.size).toBe(2)
  })
})

describe('querySimilarity', () => {
  it('returns 1 for identical queries', () => {
    expect(querySimilarity('hello world', 'hello world')).toBe(1)
  })

  it('returns 0 for completely different queries', () => {
    expect(querySimilarity('quantum physics', 'banana recipe')).toBe(0)
  })

  it('returns partial similarity for overlapping queries', () => {
    const sim = querySimilarity('quantum computing basics', 'quantum computing')
    expect(sim).toBeGreaterThan(0.5)
    expect(sim).toBeLessThan(1)
  })

  it('handles empty strings', () => {
    // Two empty strings normalize to the same single-element set
    // so they are technically "identical" — similarity of 1
    expect(querySimilarity('', '')).toBe(1)
  })
})
