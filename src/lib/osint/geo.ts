/**
 * IP Geolocation via ip-api.com.
 * No API keys required for non-commercial use (up to 45 requests/minute).
 * Returns country, region, city, ISP, ASN, latitude/longitude, and timezone.
 */

import { fetchWithTimeout } from '../http-utils'
import { EXTERNAL_API_TIMEOUT_MS } from '../constants'
import { logger } from '../logger'

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
  query: string
}

function isIp(input: string): boolean {
  const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^[a-f0-9:]+$/i
  return ipv4Regex.test(input) || ipv6Regex.test(input)
}

export async function lookupIp(
  ip: string,
  signal?: AbortSignal,
): Promise<IpInfo> {
  if (!isIp(ip)) {
    throw new Error(`"${ip}" is not a valid IP address`)
  }

  const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`

  try {
    const response = await fetchWithTimeout(url, EXTERNAL_API_TIMEOUT_MS, {
      signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`IP geolocation lookup failed: HTTP ${response.status}`)
    }

    const data = await response.json() as {
      status: string
      message?: string
      country?: string
      countryCode?: string
      region?: string
      regionName?: string
      city?: string
      zip?: string
      lat?: number
      lon?: number
      timezone?: string
      isp?: string
      org?: string
      as?: string
      query?: string
    }

    if (data.status === 'fail') {
      throw new Error(data.message || 'IP geolocation lookup failed')
    }

    return {
      ip: data.query ?? ip,
      country: data.country ?? '',
      countryCode: data.countryCode ?? '',
      region: data.region ?? '',
      regionName: data.regionName ?? '',
      city: data.city ?? '',
      zip: data.zip ?? '',
      lat: data.lat ?? 0,
      lon: data.lon ?? 0,
      timezone: data.timezone ?? '',
      isp: data.isp ?? '',
      org: data.org ?? '',
      as: data.as ?? '',
      query: data.query ?? ip,
    }
    } catch (error) {
    logger.error(`IP geolocation lookup failed for ${ip}`, error, {
      reason: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
