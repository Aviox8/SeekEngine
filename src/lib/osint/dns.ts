/**
 * DNS Recon via public DoH (DNS-over-HTTPS) resolvers.
 * No API keys required. Uses Cloudflare (1.1.1.1) and Google (8.8.8.8)
 * as public resolvers with automatic failover.
 *
 * Supported record types: A, AAAA, MX, TXT, NS, CNAME
 */

import { fetchWithTimeout } from '../http-utils'
import { EXTERNAL_API_TIMEOUT_MS } from '../constants'
import { logger } from '../logger'

export interface DnsRecord {
  type: string
  name: string
  value: string
  ttl?: number
}

export interface DnsResult {
  domain: string
  records: DnsRecord[]
  resolver: string
  resolvedAt: number
}

const PUBLIC_DOH_RESOLVERS = [
  'https://1.1.1.1/dns-query',
  'https://8.8.8.8/dns-query',
]

function dohQuery(
  url: string,
  name: string,
  type: string,
  signal?: AbortSignal,
): Promise<DnsRecord[]> {
  const dnsUrl = new URL(url)
  dnsUrl.searchParams.set('name', name)
  dnsUrl.searchParams.set('type', type)
  dnsUrl.searchParams.set('ct', 'application/dns-json')

  return fetchWithTimeout(dnsUrl.toString(), EXTERNAL_API_TIMEOUT_MS, {
    signal,
    headers: {
      'Accept': 'application/dns-json',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`DoH query failed: HTTP ${response.status}`)
      }
      const data = await response.json() as {
        Answer?: Array<{ name: string; type: number; TTL: number; data: string }>
      }
      const typeMap: Record<number, string> = {
        1: 'A',
        2: 'NS',
        5: 'CNAME',
        6: 'SOA',
        15: 'MX',
        16: 'TXT',
        28: 'AAAA',
      }
      return (data.Answer ?? []).map((record) => ({
        type: typeMap[record.type] ?? String(record.type),
        name: record.name,
        value: record.data,
        ttl: record.TTL,
      }))
    })
}

export async function resolveDns(
  domain: string,
  signal?: AbortSignal,
): Promise<DnsResult> {
  const recordTypes = ['A', 'AAAA', 'MX', 'TXT', 'NS']
  const resolver = PUBLIC_DOH_RESOLVERS[0]

  const allRecords: DnsRecord[] = []

  for (const type of recordTypes) {
    let records: DnsRecord[] = []
    let lastError: unknown = null

    // Try primary resolver, fall back to secondary
    for (const resolverUrl of PUBLIC_DOH_RESOLVERS) {
      try {
        records = await dohQuery(resolverUrl, domain, type, signal)
        break
      } catch (error) {
        lastError = error
        logger.debug(`DoH resolver ${resolverUrl} failed for ${domain} ${type}`, {
          reason: error instanceof Error ? error.message : String(error),
        })
      }
    }

    if (records.length > 0) {
      allRecords.push(...records)
    }
  }

  return {
    domain,
    records: allRecords,
    resolver,
    resolvedAt: Date.now(),
  }
}

export async function resolveDnsRecord(
  domain: string,
  type: string,
  signal?: AbortSignal,
): Promise<DnsRecord[]> {
  const resolverUrl = PUBLIC_DOH_RESOLVERS[0]

  try {
    return await dohQuery(resolverUrl, domain, type, signal)
  } catch (error) {
    // Fall back to secondary resolver
    try {
      return await dohQuery(PUBLIC_DOH_RESOLVERS[1], domain, type, signal)
    } catch (fallbackError) {
      logger.warn(`DNS resolution failed for ${domain} ${type}`, {
        reason: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }
}
