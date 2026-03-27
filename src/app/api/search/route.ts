import { NextResponse } from 'next/server'
import { getWebSearchResults } from '@/lib/google-search'
import { getSerpResults } from '@/lib/serpapi'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit'
import { sanitizeSearchQuery, isValidUTF8 } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { createErrorResponse, Errors } from '@/lib/errors'
import { validateSearchQuery } from '@/lib/validation'
import { TIME_RANGES, type TimeRangeCode } from '@/lib/constants'

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
    const timeRange = searchParams.get('time') as TimeRangeCode | null || undefined
    
    // IMPROVED: Single source of truth for time ranges
    // Previously: Maintained separate tbsMap and dateRestrictMap, causing duplication and divergence
    // Now: All time filters in one place (TIME_RANGES constant)
    let tbs: string | undefined
    let dateRestrict: string | undefined
    
    if (timeRange && timeRange in TIME_RANGES) {
      const range = TIME_RANGES[timeRange as TimeRangeCode]
      tbs = range.tbs
      dateRestrict = range.dateRestrict
    } else if (timeRange) {
      logger.warn('Invalid time range parameter', { timeRange })
      const { error, status } = createErrorResponse(
        Errors.invalidQuery(`Invalid time range: ${timeRange}. Valid values: ${Object.keys(TIME_RANGES).join(', ')}`)
      )
      return NextResponse.json(error, { status })
    }

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
    } else {
      // If SerpAPI has results, try to supplement with Google Custom Search (limit to avoid duplicates)
      const webResults = await getWebSearchResults(sanitizedQuery, 1, dateRestrict)
      const existingLinks = new Set(results.map(r => r.link))
      
      // Add unique results from Google that aren't in SerpAPI results
      const uniqueWebResults = webResults
        .filter(r => !existingLinks.has(r.link))
        .slice(0, 2) // Only add up to 2 supplementary results
        .map(r => ({
          title: r.title,
          link: r.link,
          snippet: r.snippet,
          source: r.source || r.displayLink || ''
        }))
      
      results = [...results, ...uniqueWebResults]
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
