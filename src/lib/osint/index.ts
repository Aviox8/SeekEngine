/**
 * OSINT Orchestrator
 * 
 * Orchestrates OSINT lookups across all available keyless backends:
 * - DNS resolution via public DoH resolvers (Cloudflare, Google)
 * - WHOIS/RDAP via rdap.org
 * - Certificate transparency via crt.sh
 * - IP geolocation via ip-api.com
 * 
 * All backends are free, keyless, and edge-runtime safe.
 */

import { fetchWithTimeout } from '../http-utils'
import { EXTERNAL_API_TIMEOUT_MS } from '../constants'
import { logger } from '../logger'
import { getDnsRecords, resolveDns, resolveDnsRecord } from './dns'
import { lookupWhois } from './whois'
import { lookupCertificate, lookupSubdomains } from './cert'
import { lookupIp } from './geo'

export interface DnsRecord {
  type: string
  name: string
  value: string
  ttl?: number
}

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
    countries?: string[]
  }>
}

export interface CertificateRecord {
  id: number
  issuerName: string
  commonName: string
  nameValue: string
  notBefore: string
  notAfter: string
  serialNumber: string
  sha256: string
}

export interface IpInfo {
  ip: string
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
}

export interface OsintResult {
  target: string
  type: 'domain' | 'ip'
  dns: {
    a: DnsRecord[]
    aaaa: DnsRecord[]
    mx: DnsRecord[]
    txt: DnsRecord[]
    ns: DnsRecord[]
  }
  whois: WhoisRecord | null
  certificates: CertificateRecord[]
  subdomains: string[]
  ipInfo: IpInfo | null
  summary: {
    totalRecords: number
    totalCertificates: number
    totalSubdomains: number
    hasWhois: boolean
    hasIpInfo: boolean
  }
}

async function safeDnsLookup(
  fn: () => Promise<DnsRecord[]>,
): Promise<DnsRecord[]> {
  try {
    return await fn()
  } catch (error) {
    logger.warn('DNS lookup failed', {
      reason: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

async function safeWhoisLookup(
  domain: string,
  signal?: AbortSignal,
): Promise<WhoisRecord | null> {
  try {
    return await lookupWhois(domain, signal)
  } catch (error) {
    logger.warn(`WHOIS lookup failed for ${domain}`, {
      reason: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

async function safeCertificateLookup(
  domain: string,
  signal?: AbortSignal,
): Promise<CertificateRecord[]> {
  try {
    const result = await lookupCertificate(domain, signal)
    return result.certificates
  } catch (error) {
    logger.warn(`Certificate lookup failed for ${domain}`, {
      reason: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

async function safeSubdomainLookup(
  domain: string,
  signal?: AbortSignal,
): Promise<string[]> {
  try {
    return await lookupSubdomains(domain, signal)
  } catch (error) {
    logger.warn(`Subdomain lookup failed for ${domain}`, {
      reason: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

async function safeIpLookup(
  ip: string,
  signal?: AbortSignal,
): Promise<IpInfo | null> {
  try {
    return await lookupIp(ip, signal)
  } catch (error) {
    logger.warn(`IP geolocation lookup failed for ${ip}`, {
      reason: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export async function runOsintLookup(
  target: string,
  signal?: AbortSignal,
): Promise<OsintResult> {
  const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(target)
  const isDomain = !isIp && target.includes('.')

  if (!isIp && !isDomain) {
    throw new Error(`"${target}" is not a valid domain or IP address`)
  }

  const startTime = Date.now()

  // Run DNS resolution first (needed for IP geolocation)
  const [aRecords, aaaaRecords, mxRecords, txtRecords, nsRecords] =
    await Promise.all([
      safeDnsLookup(() => resolveDnsRecord(target, 'A', signal)),
      safeDnsLookup(() => resolveDnsRecord(target, 'AAAA', signal)),
      safeDnsLookup(() => resolveDnsRecord(target, 'MX', signal)),
      safeDnsLookup(() => resolveDnsRecord(target, 'TXT', signal)),
      safeDnsLookup(() => resolveDnsRecord(target, 'NS', signal)),
    ])

  // Run WHOIS for domains only
  const whois = isDomain ? await safeWhoisLookup(target, signal) : null

  // Run certificate transparency for domains only
  const certificates = isDomain
    ? await safeCertificateLookup(target, signal)
    : []

  // Run subdomain enumeration for domains only
  const subdomains = isDomain
    ? await safeSubdomainLookup(target, signal)
    : []

  // IP geolocation: resolve A record first if domain, or use target directly if IP
  let ipInfo: IpInfo | null = null
  const targetIp = isIp ? target : aRecords[0]?.value
  if (targetIp) {
    ipInfo = await safeIpLookup(targetIp, signal)
  }

  const totalRecords =
    aRecords.length +
    aaaaRecords.length +
    mxRecords.length +
    txtRecords.length +
    nsRecords.length

  return {
    target,
    type: isIp ? 'ip' : 'domain',
    dns: {
      a: aRecords,
      aaaa: aaaaRecords,
      mx: mxRecords,
      txt: txtRecords,
      ns: nsRecords,
    },
    whois,
    certificates,
    subdomains,
    ipInfo,
    summary: {
      totalRecords,
      totalCertificates: certificates.length,
      totalSubdomains: subdomains.length,
      hasWhois: !!whois,
      hasIpInfo: !!ipInfo,
    },
  }
}
