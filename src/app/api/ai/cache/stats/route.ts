/**
 * API Route: /api/ai/cache/stats
 * Returns semantic cache statistics for monitoring
 * 
 * SECURITY: Requires API key authentication + rate limiting
 */

import { getCacheStats, clearExpiredEntries } from '@/lib/semantic-cache'
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import { getOpenRouterApiKeys } from '@/lib/env'
import { NextResponse, NextRequest } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Require API key for authentication
  const authHeader = request.headers.get('authorization')
  const apiKeys = getOpenRouterApiKeys()
  
  if (apiKeys.length === 0) {
    return NextResponse.json(
      { error: { code: 'API_KEY_MISSING', message: 'No API keys configured', retryable: false } },
      { status: 500 }
    )
  }

  const providedKey = authHeader?.replace('Bearer ', '')
  if (!providedKey || !apiKeys.includes(providedKey)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key', retryable: false } },
      { status: 401 }
    )
  }

  // Rate limiting
  const ip = getClientIP(request)
  const rl = checkRateLimit(`cache-stats:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000,
  })
  
  if (!rl.allowed) {
    return rateLimitResponse(rl)
  }

  // Clean up expired entries first
  const cleared = clearExpiredEntries()
  
  // Get current stats
  const stats = getCacheStats()
  
  return NextResponse.json({
    ...stats,
    clearedExpired: cleared,
    timestamp: Date.now(),
  })
}
