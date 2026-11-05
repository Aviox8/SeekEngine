/**
 * WHOIS/RDAP lookup via public RDAP servers.
 * No API keys required. Uses rdap.org as the primary endpoint with
 * fallback to regional RDAP servers.
 *
 * Supports domain and IP lookups.
 */

import { fetchWithTimeout } from '../http-utils'
import { EXTERNAL_API_TIMEOUT_MS } from '../constants'
import { logger } from '../logger'

export interface WhoisRecord {
  query: string
  type: 'domain' | 'ip' | 'autnum'
  registry?: string
  registrar?: string
  registeredDate?: string
  expiryDate?: string
  updatedDate?: string
  status?: string[]
  nameServers?: string[]
  entities?: Array<{
    name?: string
    roles?: string[]
    emails?: string[]
    phones?: string[]
    countries?: string[]
  }>
  raw?: string
}

function isDomain(input: string): boolean {
  // Simple heuristic: contains a dot and no colons/slashes typical of IPs
  return input.includes('.') && !input.includes(':') && !input.includes('/')
}

function isIp(input: string): boolean {
  const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^[a-f0-9:]+$/i
  return ipv4Regex.test(input) || ipv6Regex.test(input)
}

async function rdapQuery(url: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
  const response = await fetchWithTimeout(url, EXTERNAL_API_TIMEOUT_MS, {
    signal,
    headers: {
      'Accept': 'application/rdap+json',
    },
  })

  if (!response.ok) {
    throw new Error(`RDAP query failed: HTTP ${response.status}`)
  }

  return (await response.json()) as Record<string, unknown>
}

function parseDomainRecord(data: Record<string, unknown>): WhoisRecord {
  const entities: Array<{
    name?: string
    roles?: string[]
    emails?: string[]
    countries?: string[]
  }> = []

  const entitiesRaw = data['entities'] as Array<Record<string, unknown>> ?? []
  entitiesRaw.forEach((entity) => {
    const vcardArray = entity['vcardArray'] as Array<unknown> ?? []
    const vcard = vcardArray[1] as Array<Array<string>> ?? []
    const fields: Record<string, string> = {}
    vcard.forEach((item) => {
      if (Array.isArray(item) && item.length >= 3) {
        fields[item[1] ?? ''] = item[3] ?? ''
      }
    })

    const emails: string[] = []
    const roles: string[] = []

    // Handle entities array structure
    const entityArray = entity['entities'] as Array<Record<string, unknown>> ?? []
    entityArray.forEach((ent) => {
      const entVcard = ent['vcardArray'] as Array<unknown> ?? []
      const entFields: Record<string, string> = {}
      entVcard.forEach((item) => {
        if (Array.isArray(item) && item.length >= 3) {
          entFields[item[1] ?? ''] = item[3] ?? ''
        }
      })
      if (entFields['fn']) {
        emails.push(entFields['fn'])
      }
    })

    entities.push({
      name: entFields['fn'],
      roles: entity['roles'] as string[] ?? [],
      emails,
      countries: entFields['country'] ? [entFields['country']] : [],
    })
  })

  return {
    query: data['query'] as string ?? '',
    type: 'domain',
    registrar: entities.find((e) => e.roles?.includes('registrar'))?.name,
    registeredDate: undefined,
    expiryDate: undefined,
    updatedDate: undefined,
    status: data['status'] as string[] ?? [],
    nameServers: data['nameservers'] as string[] ?? [],
    entities,
  }
}

function parseIpRecord(data: Record<string, unknown>): WhoisRecord {
  const entitiesRaw = data['entities'] as Array<Record<string, unknown>> ?? []
  const entities: Array<{
    name?: string
    roles?: string[]
    emails?: string[]
    countries?: string[]
  }> = []

  entitiesRaw.forEach((entity) => {
    const vcardArray = entity['vcardArray'] as Array<unknown> ?? []
    const vcard = vcardArray[1] as Array<Array<string>> ?? []
    const fields: Record<string, string> = {}
    vcard.forEach((item) => {
      if (Array.isArray(item) && item.length >= 3) {
        fields[item[1] ?? ''] = item[3] ?? ''
      }
    })

    entities.push({
      name: fields['fn'],
      roles: entity['roles'] as string[] ?? [],
      emails: fields['email'] ? [fields['email']] : [],
      countries: fields['country'] ? [fields['country']] : [],
    })
  })

  return {
    query: data['query'] as string ?? '',
    type: 'ip',
    registry: data['registry'] as string,
    registeredDate: data['registration date'] as string,
    updatedDate: data['last changed'] as string,
    status: data['status'] as string[] ?? [],
    nameServers: [],
    entities,
  }
}

export async function lookupWhois(
  query: string,
  signal?: AbortSignal,
): Promise<WhoisRecord> {
  const isDomainName = isDomain(query)
  const isIpAddress = isIp(query)

  if (!isDomainName && !isIpAddress) {
    throw new Error(`Unable to determine if "${query}" is a domain or IP address`)
  }

  if (isDomainName) {
    const url = `https://rdap.org/domain/${encodeURIComponent(query)}`
    try {
      const data = await rdapQuery(url, signal)
      return parseDomainRecord(data)
    } catch (error) {
      // Fallback to alternative RDAP bootstrap
      try {
        const fallbackUrl = `https://rdap.icann.org/domain/${encodeURIComponent(query)}`
        const data = await rdapQuery(fallbackUrl, signal)
        return parseDomainRecord(data)
      } catch (fallbackError) {
        logger.error(`WHOIS/RDAP lookup failed for domain ${query}`, fallbackError, {
          reason: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        })
        throw error
      }
    }
  } else {
    // IP address lookup
    const url = `https://rdap.org/ip/${encodeURIComponent(query)}`
    try {
      const data = await rdapQuery(url, signal)
      return parseIpRecord(data)
    } catch (error) {
      try {
        const fallbackUrl = `https://rdap.icann.org/ip/${encodeURIComponent(query)}`
        const data = await rdapQuery(fallbackUrl, signal)
        return parseIpRecord(data)
      } catch (fallbackError) {
        logger.error(`WHOIS/RDAP lookup failed for IP ${query}`, fallbackError, {
          reason: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        })
        throw error
      }
    }
  }
}
