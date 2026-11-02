/**
 * API Route: /api/ai/suggest
 * Returns AI-powered search suggestions with semantic caching
 */

import { getSearchSuggestions } from '@/lib/openrouter'
import { validateSearchQuery } from '@/lib/validation'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit'
import { createErrorResponse } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache for suggestions (shorter TTL)
const suggestionsCache = new Map<string, {
  suggestions: string[]
  model: string
  modelHuman: string
  cachedAt: number
}>()

const SUGGESTIONS_CACHE_TTL = 1000 * 60 * 10 // 10 minutes

function normalizeForCache(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ')
}

// Enable edge runtime for faster cold starts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = getClientIP(request)
  const rl = checkRateLimit(`suggest:${ip}`, RATE_LIMITS.suggest)
  if (!rl.allowed) return rateLimitResponse(rl)

  const { searchParams } = new URL(request.url)
  
  // Validate query
  const validation = validateSearchQuery(searchParams)
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    )
  }

  const query = validation.query!
  logger.debug('Suggest request', { query: query.slice(0, 50) })
  const cacheKey = normalizeForCache(query)

  try {
    // Check cache first
    const cached = suggestionsCache.get(cacheKey)
    if (cached && Date.now() - cached.cachedAt < SUGGESTIONS_CACHE_TTL) {
      logger.debug('Suggestions cache hit', { query: query.slice(0, 30), cacheKey })
      return NextResponse.json(
        {
          suggestions: cached.suggestions,
          model: cached.model,
          modelHuman: cached.modelHuman,
          latencyMs: 0,
          attempts: 0,
          cached: true,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'HIT',
          },
        }
      )
    }

    // Cache miss - generate new suggestions
    const result = await getSearchSuggestions(query)
    
    // Cache the result
    if (result.suggestions.length > 0 && result.model !== 'fallback') {
      suggestionsCache.set(cacheKey, {
        suggestions: result.suggestions,
        model: result.model,
        modelHuman: result.modelHuman,
        cachedAt: Date.now(),
      })
      
      // MEDIUM PRIORITY FIX: Atomic LRU cleanup to prevent size overflow
      // Previously: Race condition allowed cache to exceed limits
      // Now: Check and evict atomically after insertion
      const MAX_CACHE_SIZE = 200
      while (suggestionsCache.size > MAX_CACHE_SIZE) {
        // Find and delete oldest entry
        let oldestKey: string | null = null
        let oldestTime = Infinity
        for (const [key, entry] of suggestionsCache.entries()) {
          if (entry.cachedAt < oldestTime) {
            oldestTime = entry.cachedAt
            oldestKey = key
          }
        }
        if (oldestKey) {
          suggestionsCache.delete(oldestKey)
        } else {
          break // Safety: unexpected state
        }
      }
    }
    
    return NextResponse.json(
      {
        suggestions: result.suggestions,
        model: result.model,
        modelHuman: result.modelHuman,
        latencyMs: result.latencyMs,
        attempts: result.attempts,
        cached: false,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Cache': 'MISS',
        },
      }
    )
  } catch (error) {
    logger.error('Suggest endpoint error', error instanceof Error ? error.message : String(error))
    const errorResponse = createErrorResponse(error)
    return NextResponse.json(
      errorResponse.error,
      { status: errorResponse.status }
    )
  }
}
