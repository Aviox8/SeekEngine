/**
 * API Request Middleware
 * Common patterns for rate limiting, validation, and error handling
 * Reduces boilerplate across route handlers
 */

import { NextResponse } from 'next/server'
import { getClientIP, checkRateLimit, rateLimitResponse, RATE_LIMITS } from './rate-limit'
import { validateSearchQuery } from './validation'
import { sanitizeSearchQuery } from './sanitize'
import { logger } from './logger'
import { createErrorResponse, Errors } from './errors'

/**
 * Check rate limit for a specific endpoint
 * @param request - Request object
 * @param endpoint - Endpoint identifier (e.g., 'search', 'suggestions')
 * @returns Rate limit response or null if allowed
 */
export function checkEndpointRateLimit(
  request: Request,
  endpoint: keyof typeof RATE_LIMITS
): Response | null {
  const ip = getClientIP(request)
  const config = RATE_LIMITS[endpoint]
  
  if (!config) {
    logger.error('Unknown endpoint for rate limiting', new Error(`Unknown endpoint: ${endpoint}`))
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  const rl = checkRateLimit(`${endpoint}:${ip}`, config)
  if (!rl.allowed) {
    logger.warn('Rate limit exceeded', { endpoint, ip })
    return rateLimitResponse(rl)
  }

  return null
}

/**
 * Validate and sanitize search query from request
 * @param request - Request object
 * @returns Object with { query, error, status } or null response on error
 */
export function validateAndSanitizeQuery(request: Request): 
  | { query: string; error: null }
  | { query: null; error: Response } {
  
  const { searchParams } = new URL(request.url)
  const validation = validateSearchQuery(searchParams)

  if (!validation.valid) {
    logger.warn('Invalid search query', { error: validation.error })
    const { error, status } = createErrorResponse(
      Errors.invalidQuery(validation.error)
    )
    return {
      query: null,
      error: NextResponse.json(error, { status }),
    }
  }

  const query = validation.query!
  const sanitized = sanitizeSearchQuery(query)
  
  logger.debug('Query validated and sanitized', {
    original: query,
    sanitized,
    ip: getClientIP(request),
  })

  return { query: sanitized, error: null }
}

/**
 * Combined middleware: rate limit + validation
 * Use this in routes that need both checks
 * @returns { query, error } where error is Response if validation failed
 */
export function checkEndpointAndQuery(
  request: Request,
  endpoint: keyof typeof RATE_LIMITS
): 
  | { query: string; error: null }
  | { query: null; error: Response } {
  
  // Check rate limit first
  const rateLimitError = checkEndpointRateLimit(request, endpoint)
  if (rateLimitError) {
    return { query: null, error: rateLimitError }
  }

  // Then validate query
  return validateAndSanitizeQuery(request)
}
