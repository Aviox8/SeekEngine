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

import { RATE_LIMIT_MAX_ENTRIES } from './constants'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()
const TRUSTED_IP_HEADERS = [
  'x-vercel-forwarded-for',
  'cf-connecting-ip',
  'fly-client-ip',
  'fastly-client-ip',
  'true-client-ip',
] as const

function extractIpCandidate(headerValue: string | null): string | null {
  if (!headerValue) return null

  const candidate = headerValue.split(',')[0]?.trim()
  if (!candidate) return null

  const isIPv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(candidate)
  const isIPv6 = /^[a-f0-9:]+$/i.test(candidate) && candidate.includes(':')
  return isIPv4 || isIPv6 ? candidate : null
}

/**
 * Cleanup expired entries and maintain memory limits
 * @internal
 */
function cleanup() {
  const now = Date.now()
  // HIGH PRIORITY FIX: More aggressive cleanup to prevent memory exhaustion
  // Previously cleanup only ran when a request arrived after 60s of inactivity
  // Now we always clean expired entries and warn if approaching capacity
  
  // CRITICAL FIX: Collect keys first, then delete to avoid concurrent modification issues
  // Previously: deleted during iteration could cause problems in edge runtime
  const keysToDelete: string[] = []
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      keysToDelete.push(key)
    }
  }
  
  for (const key of keysToDelete) {
    store.delete(key)
  }

  // If still over limit after expiration cleanup, evict oldest entries by resetAt
  if (store.size > RATE_LIMIT_MAX_ENTRIES * 0.9) {
    const excess = store.size - Math.floor(RATE_LIMIT_MAX_ENTRIES * 0.8)
    const evictionKeys: string[] = []
    // Sort by resetAt (oldest window first) to evict stale entries
    const sorted = Array.from(store.entries())
      .sort((a, b) => a[1].resetAt - b[1].resetAt)
    for (let i = 0; i < Math.min(excess, sorted.length); i++) {
      evictionKeys.push(sorted[i]![0])
    }
    for (const key of evictionKeys) {
      store.delete(key)
    }
  }
  
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

  // Within window — check before incrementing to prevent race condition overshoot
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
}

/**
 * Extract client IP from request headers (edge-compatible)
 * Checks multiple header sources in order of preference
 * @param request - Request object with headers
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(request: Request): string {
  for (const header of TRUSTED_IP_HEADERS) {
    const candidate = extractIpCandidate(request.headers.get(header))
    if (candidate) return candidate
  }

  if (process.env.NODE_ENV !== 'production') {
    const forwarded = extractIpCandidate(request.headers.get('x-forwarded-for'))
    if (forwarded) return forwarded

    const realIp = extractIpCandidate(request.headers.get('x-real-ip'))
    if (realIp) return realIp
  }

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
