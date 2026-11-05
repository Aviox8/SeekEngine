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
import { isRedisConfigured, redisKeys, redisTry } from '@/lib/redis'

type SuggestionsCacheEntry = {
  suggestions: string[]
  model: string
  modelHuman: string
  cachedAt: number
}

// In-memory fallback cache (used only when Redis is not configured)
const suggestionsCache = new Map<string, SuggestionsCacheEntry>()

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
  const rl = await checkRateLimit(`suggest:${ip}`, RATE_LIMITS.suggest)
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
    // Check cache first (shared Redis when configured, in-memory otherwise)
    if (isRedisConfigured()) {
      const cached = await redisTry<SuggestionsCacheEntry | null>('suggest get', async (r) => {
        const raw = await r.get<SuggestionsCacheEntry>(redisKeys.suggestions(cacheKey))
        return raw ?? null
      })
      if (cached) {
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
    } else {
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
    }

    // Cache miss - generate new suggestions
    const result = await getSearchSuggestions(query)
    
    // Cache the result
    if (result.suggestions.length > 0 && result.model !== 'fallback') {
      const entry: SuggestionsCacheEntry = {
        suggestions: result.suggestions,
        model: result.model,
        modelHuman: result.modelHuman,
        cachedAt: Date.now(),
      }

      if (isRedisConfigured()) {
        void redisTry('suggest set', async (r) => {
          await r.set(redisKeys.suggestions(cacheKey), entry, { ex: Math.floor(SUGGESTIONS_CACHE_TTL / 1000) })
          return true
        })
      } else {
        suggestionsCache.set(cacheKey, entry)

        // Evict the oldest entries in one pass once the cap is exceeded
        const MAX_CACHE_SIZE = 200
        if (suggestionsCache.size > MAX_CACHE_SIZE) {
          const overflow = suggestionsCache.size - MAX_CACHE_SIZE
          const byOldest = [...suggestionsCache.entries()].sort(
            (a, b) => a[1].cachedAt - b[1].cachedAt
          )
          for (let i = 0; i < overflow; i++) {
            const oldest = byOldest[i]
            if (oldest) suggestionsCache.delete(oldest[0])
          }
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
