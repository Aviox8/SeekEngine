import { NextResponse } from 'next/server'
import { getWebSearchResults } from '@/lib/google-search'
import { getSerpResults } from '@/lib/serpapi'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit'
import { sanitizeSearchQuery, isValidUTF8 } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { createErrorResponse, Errors } from '@/lib/errors'
import { validateSearchQuery } from '@/lib/validation'

export const runtime = 'edge'

/**
 * GET /api/search
 * 
 * Web search endpoint that aggregates results from multiple providers
 * Falls back from SerpAPI → Google Custom Search if primary fails
 * 
 * Query Parameters:
 * - q (required): Search query (2-500 characters)
 * - time (optional): Time filter (h/d/w/m/y for hour/day/week/month/year)
 * 
 * Rate Limit: 30 requests/min per IP
 * 
 * Returns:
 * {
 *   results: Array<{
 *     title: string
 *     link: string
 *     snippet: string
 *     source: string
 *   }>
 * }
 */
export async function GET(request: Request) {
  const endTimer = logger.time('search-request')

  try {
    // Rate limiting
    const ip = getClientIP(request)
    const rl = checkRateLimit(`search:${ip}`, RATE_LIMITS.search)
    if (!rl.allowed) {
      logger.warn('Rate limit exceeded', { endpoint: '/api/search', ip })
      return rateLimitResponse(rl)
    }

    // Parse and validate query
    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q')

    const validation = validateSearchQuery(searchParams)
    if (!validation.valid) {
      logger.warn('Invalid search query', { error: validation.error })
      const { error, status } = createErrorResponse(
        Errors.invalidQuery(validation.error)
      )
      return NextResponse.json(error, { status })
    }

    const query = validation.query!

    // Validate UTF-8 encoding
    if (!isValidUTF8(query)) {
      logger.warn('Invalid UTF-8 encoding', { query: rawQuery })
      const { error, status } = createErrorResponse(
        Errors.invalidInput('query', 'Invalid character encoding')
      )
      return NextResponse.json(error, { status })
    }

    // Sanitize query for external APIs
    const sanitizedQuery = sanitizeSearchQuery(query)
    logger.debug('Search query received', { 
      original: query, 
      sanitized: sanitizedQuery,
      ip 
    })

    // Parse optional time filter
    const timeRange = searchParams.get('time') || undefined
    // HIGH PRIORITY FIX: Validate time parameter against allowed values
    // Previously accepted arbitrary values silently without validation
    if (timeRange) {
      const validTimes = new Set(['h', 'd', 'w', 'm', 'y'])
      if (!validTimes.has(timeRange)) {
        logger.warn('Invalid time range parameter', { timeRange })
        const { error, status } = createErrorResponse(
          Errors.invalidQuery(`Invalid time range: ${timeRange}. Valid values: h, d, w, m, y`)
        )
        return NextResponse.json(error, { status })
      }
    }
    const tbsMap: Record<string, string> = { 
      h: 'qdr:h', d: 'qdr:d', w: 'qdr:w', m: 'qdr:m', y: 'qdr:y' 
    }
    const dateRestrictMap: Record<string, string> = { 
      h: 'd1', d: 'd1', w: 'w1', m: 'm1', y: 'y1' 
    }
    const tbs = timeRange ? tbsMap[timeRange] : undefined
    const dateRestrict = timeRange ? dateRestrictMap[timeRange] : undefined

    // Try SerpAPI first, fall back to Google Custom Search
    let results = await getSerpResults(sanitizedQuery, tbs)
    
    if (!results || results.length === 0) {
      logger.debug('SerpAPI returned no results, trying Google Custom Search')
      const webResults = await getWebSearchResults(sanitizedQuery, 1, dateRestrict)
      
      // Normalize to consistent format
      results = webResults.map(r => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet,
        source: r.source || r.displayLink || ''
      }))
    }

    logger.info('Search completed successfully', { 
      query: sanitizedQuery, 
      resultCount: results.length 
    })
    endTimer()

    return NextResponse.json({ results })
    
  } catch (error) {
    logger.error('Search endpoint error', error instanceof Error ? error.message : String(error))
    const { error: errorBody, status } = createErrorResponse(error)
    return NextResponse.json(errorBody, { status })
  }
}
