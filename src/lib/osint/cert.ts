/**
 * Certificate Transparency lookup via crt.sh.
 * No API keys required. crt.sh is a public certificate transparency log
 * aggregator operated by Sectigo (formerly Comodo).
 *
 * Returns certificate entries for a given domain, including wildcard
 * matches, with issuer, validity dates, and serial numbers.
 */

import { fetchWithTimeout } from '../http-utils'
import { EXTERNAL_API_TIMEOUT_MS } from '../constants'
import { logger } from '../logger'

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

export interface CertificateResult {
  domain: string
  certificates: CertificateRecord[]
  totalCount: number
}

export async function lookupCertificate(
  domain: string,
  signal?: AbortSignal,
): Promise<CertificateResult> {
  const url = `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`

  try {
    const response = await fetchWithTimeout(url, EXTERNAL_API_TIMEOUT_MS, {
      signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { domain, certificates: [], totalCount: 0 }
      }
      throw new Error(`Certificate transparency lookup failed: HTTP ${response.status}`)
    }

    const data = await response.json() as Array<{
      id: number
      issuer_name: string
      common_name: string
      name_value: string
      not_before: string
      not_after: string
      serial_number: string
      sha256: string
    }>

    const certificates: CertificateRecord[] = data.map((entry) => ({
      id: entry.id,
      issuerName: entry.issuer_name,
      commonName: entry.common_name,
      nameValue: entry.name_value,
      notBefore: entry.not_before,
      notAfter: entry.not_after,
      serialNumber: entry.serial_number,
      sha256: entry.sha256,
    }))

    return {
      domain,
      certificates,
      totalCount: certificates.length,
    }
    } catch (error) {
    logger.error(`Certificate transparency lookup failed for ${domain}`, error, {
      reason: error instanceof Error ? error.message : String(error),
    })
    return { domain, certificates: [], totalCount: 0 }
  }
}

export async function lookupSubdomains(
  domain: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const result = await lookupCertificate(domain, signal)

  const subdomains = new Set<string>()
  for (const cert of result.certificates) {
    const name = cert.nameValue.toLowerCase().trim()
    if (name.endsWith(`.${domain.toLowerCase()}`) || name === domain.toLowerCase()) {
      subdomains.add(name)
    }
  }

  return Array.from(subdomains)
}
