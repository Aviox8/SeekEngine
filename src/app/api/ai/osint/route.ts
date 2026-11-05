/**
 * API Route: /api/ai/osint
 * 
 * Open Source Intelligence (OSINT) lookup endpoint.
 * All lookups use keyless, public endpoints:
 *   - DNS: Cloudflare (1.1.1.1) and Google (8.8.8.8) DoH
 *   - WHOIS/RDAP: rdap.org
 *   - Certificate Transparency: crt.sh
 *   - IP Geolocation: ip-api.com
 * 
 * Query Parameters:
 *   - q (required): Domain or IP address to investigate
 * 
 * Rate Limit: 30 requests/min per IP
 * 
 * Returns:
 * {
 *   target: string
 *   type: 'domain' | 'ip'
 *   dns: { a, aaaa, mx, txt, ns: DnsRecord[] }
 *   whois: WhoisRecord | null
 *   certificates: CertificateRecord[]
 *   subdomains: string[]
 *   ipInfo: IpInfo | null
 *   summary: { totalRecords, totalCertificates, totalSubdomains, hasWhois, hasIpInfo }
 * }
 */

import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { createErrorResponse, Errors } from '@/lib/errors'
import { validateSearchQuery } from '@/lib/validation'
import { runOsintLookup } from '@/lib/osint'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const endTimer = logger.time('osint-request')

  try {
    // Rate limiting
    const ip = getClientIP(request)
    const rl = await checkRateLimit(`osint:${ip}`, RATE_LIMITS.search)
    if (!rl.allowed) {
      logger.warn('OSINT rate limit exceeded', { endpoint: '/api/ai/osint', ip })
      return rateLimitResponse(rl)
    }

    // Parse and validate query
    const { searchParams } = new URL(request.url)

    const validation = validateSearchQuery(searchParams)
    if (!validation.valid) {
      logger.warn('Invalid OSINT query', { error: validation.error })
      const { error, status } = createErrorResponse(
        Errors.invalidQuery(validation.error)
      )
      return NextResponse.json(error, { status })
    }

    const query = validation.query!
    logger.debug('OSINT query received', { original: query, ip })

    const result = await runOsintLookup(query, request.signal)

    logger.info('OSINT lookup completed successfully', {
      query,
      type: result.type,
      totalRecords: result.summary.totalRecords,
      totalCertificates: result.summary.totalCertificates,
      totalSubdomains: result.summary.totalSubdomains,
      hasWhois: result.summary.hasWhois,
      hasIpInfo: result.summary.hasIpInfo,
    })
    endTimer()

    return NextResponse.json(result)

  } catch (error) {
    logger.error('OSINT endpoint error', error instanceof Error ? error.message : String(error))
    const { error: errorBody, status } = createErrorResponse(error)
    return NextResponse.json(errorBody, { status })
  }
}
