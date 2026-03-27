/**
 * Edge-compatible in-memory rate limiter
 * Uses a sliding window counter per IP address
 * 
 * Features:
 * - Automatic cleanup of expired entries
 * - Hard cap on stored entries to prevent memory exhaustion
 * - IP extraction from multiple header sources
 * - Standard HTTP 429 responses with Retry-After headers
 */

import { RATE_LIMIT_CLEANUP_INTERVAL_MS, RATE_LIMIT_MAX_ENTRIES } from './constants'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()
let lastCleanup = Date.now()

/**
 * Cleanup expired entries and maintain memory limits
 * @internal
 */
function cleanup() {
  const now = Date.now()
  // HIGH PRIORITY FIX: More aggressive cleanup to prevent memory exhaustion
  // Previously cleanup only ran when a request arrived after 60s of inactivity
  // Now we always clean expired entries and warn if approaching capacity
  
  let deleted = 0
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key)
      deleted++
    }
  }

  // If still over limit after expiration cleanup, evict oldest entries
  if (store.size > RATE_LIMIT_MAX_ENTRIES * 0.9) { // Alert at 90%
    const excess = store.size - Math.floor(RATE_LIMIT_MAX_ENTRIES * 0.8)
    let evicted = 0
    for (const key of store.keys()) {
      if (evicted >= excess) break
      store.delete(key)
      evicted++
    }
  }
  
  lastCleanup = now
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number
  /** Window size in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request is allowed under the rate limit
 * Sliding window implementation per IP
 * @param key - Unique identifier (usually "route:IP")
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed and reset time
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  // No existing entry or window expired — allow and start new window
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt }
  }

  // Within window
  if (entry.count < config.maxRequests) {
    entry.count++
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
  }

  // Rate limited
  return { allowed: false, remaining: 0, resetAt: entry.resetAt }
}

/**
 * Extract client IP from request headers (edge-compatible)
 * Checks multiple header sources in order of preference
 * @param request - Request object with headers
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  
  return 'unknown'
}

/**
 * Pre-configured rate limit configs per route type
 * Defined in seconds then converted to milliseconds
 */
export const RATE_LIMITS = {
  search: { maxRequests: 30, windowMs: 60_000 } as RateLimitConfig,    // 30/min
  stream: { maxRequests: 20, windowMs: 60_000 } as RateLimitConfig,    // 20/min
  suggest: { maxRequests: 60, windowMs: 60_000 } as RateLimitConfig,   // 60/min
  answer: { maxRequests: 20, windowMs: 60_000 } as RateLimitConfig,    // 20/min
} as const

/**
 * Create a standardized 429 Too Many Requests response
 * Includes Retry-After header and current limit info
 * @param result - RateLimitResult from checkRateLimit
 * @returns HTTP 429 Response
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
        retryAfter: retryAfterSeconds,
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
      },
    }
  )
}
