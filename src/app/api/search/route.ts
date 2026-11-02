import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit'
import { sanitizeSearchQuery, isValidUTF8 } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { createErrorResponse, Errors } from '@/lib/errors'
import { validateSearchQuery, validateTimeRange } from '@/lib/validation'
import { getSearchContext } from '@/lib/search-context'

export const runtime = 'edge'

/**
 * GET /api/search
 * 
 * Web search endpoint that aggregates results from multiple providers
 * Falls back from SerpAPI → Google Custom Search if primary fails
 * 
 * Query Parameters:
 * - q (required): Search query (1-500 characters)
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
    const timeValidation = validateTimeRange(searchParams.get('time'))
    if (!timeValidation.valid) {
      logger.warn('Invalid time range parameter', { timeRange: searchParams.get('time') })
      const { error, status } = createErrorResponse(
        Errors.invalidQuery(timeValidation.error)
      )
      return NextResponse.json(error, { status })
    }
    const timeRange = timeValidation.timeRange

    const { results, provider, cached } = await getSearchContext(
      sanitizedQuery,
      timeRange,
      request.signal
    )

    logger.info('Search completed successfully', { 
      query: sanitizedQuery, 
      resultCount: results.length,
      provider,
      cached,
    })
    endTimer()

    return NextResponse.json({ results })
    
  } catch (error) {
    logger.error('Search endpoint error', error instanceof Error ? error.message : String(error))
    const { error: errorBody, status } = createErrorResponse(error)
    return NextResponse.json(errorBody, { status })
  }
}
