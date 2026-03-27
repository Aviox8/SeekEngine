/**
 * API Route: /api/ai/cache/stats
 * Returns semantic cache statistics for monitoring
 * 
 * SECURITY: Rate limited to prevent information disclosure attacks
 */

import { getCacheStats, clearExpiredEntries } from '../../../../../lib/semantic-cache'
import { checkRateLimit, getClientIP, rateLimitResponse } from '../../../../../lib/rate-limit'
import { NextResponse, NextRequest } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // MEDIUM PRIORITY FIX: Add rate limiting for security
  // Previously: Stats endpoint exposed without protection, allowing fingerprinting
  // Attacker could infer cache state and usage patterns
  const ip = getClientIP(request)
  const rl = checkRateLimit(`cache-stats:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000, // 10 per minute - generous for monitoring
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
