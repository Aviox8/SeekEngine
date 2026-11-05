/**
 * API Route: /api/cron/redis-warm
 * Keeps the fallback Redis (Layerbase, sleeps when idle) warm.
 *
 * Called every 10 minutes by GitHub Actions (see .github/workflows/redis-warm.yml)
 * so the instance never reaches its 15-minute sleep threshold.
 *
 * Auth: Authorization: Bearer <CRON_SECRET> (falls back to CACHE_STATS_SECRET or ADMIN_SECRET)
 */

import { NextResponse } from 'next/server'
import { warmRedis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { timingSafeStringEqual } from '@/lib/utils'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET || process.env.CACHE_STATS_SECRET || process.env.ADMIN_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: { code: 'SERVER_MISCONFIGURED', message: 'CRON_SECRET not configured', retryable: false } },
      { status: 500 }
    )
  }

  const providedSecret = authHeader?.replace('Bearer ', '')
  if (!providedSecret || !timingSafeStringEqual(providedSecret, secret)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing cron secret', retryable: false } },
      { status: 401 }
    )
  }

  try {
    const result = await warmRedis()
    logger.info('Redis warm check', {
      primary: result.primary,
      fallback: result.fallback,
    })
    return NextResponse.json({ ...result, timestamp: Date.now() })
  } catch (error) {
    logger.error('Redis warm check failed', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Warm check failed', retryable: true } },
      { status: 500 }
    )
  }
}
