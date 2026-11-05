/**
 * API Route: /api/ai/cache/stats
 * Returns semantic cache statistics for monitoring
 * 
 * SECURITY: Requires ADMIN_SECRET authentication + rate limiting
 */

import { getCacheStats, clearExpiredEntries } from '@/lib/semantic-cache'
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit'
import { timingSafeStringEqual } from '@/lib/utils'
import { NextResponse, NextRequest } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Require admin secret for authentication (not API keys)
  const authHeader = request.headers.get('authorization')
  const adminSecret = process.env.CACHE_STATS_SECRET || process.env.ADMIN_SECRET

  if (!adminSecret) {
    return NextResponse.json(
      { error: { code: 'SERVER_MISCONFIGURED', message: 'Cache stats endpoint not configured', retryable: false } },
      { status: 500 }
    )
  }

  const providedSecret = authHeader?.replace('Bearer ', '')
  if (!providedSecret || !timingSafeStringEqual(providedSecret, adminSecret)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing admin secret', retryable: false } },
      { status: 401 }
    )
  }

  // Rate limiting
  const ip = getClientIP(request)
  const rl = await checkRateLimit(`cache-stats:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000,
  })
  
  if (!rl.allowed) {
    return rateLimitResponse(rl)
  }

  // Clean up expired entries first
  const cleared = await clearExpiredEntries()
  
  // Get current stats
  const stats = await getCacheStats()
  
  return NextResponse.json({
    ...stats,
    clearedExpired: cleared,
    timestamp: Date.now(),
  })
}
