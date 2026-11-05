'use client'

/**
 * OsintCard Component — Open Source Intelligence display
 * Shows DNS records, WHOIS, certificate transparency, subdomains, and IP geolocation
 * for a domain or IP address. All data comes from keyless public sources.
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface OsintResult {
  target: string
  type: 'domain' | 'ip'
  dns: {
    a: Array<{ type: string; name: string; value: string; ttl?: number }>
    aaaa: Array<{ type: string; name: string; value: string; ttl?: number }>
    mx: Array<{ type: string; name: string; value: string; ttl?: number }>
    txt: Array<{ type: string; name: string; value: string; ttl?: number }>
    ns: Array<{ type: string; name: string; value: string; ttl?: number }>
  }
  whois: {
    query: string
    type: string
    registrar?: string
    registeredDate?: string
    expiryDate?: string
    updatedDate?: string
    status?: string[]
    nameServers?: string[]
  } | null
  certificates: Array<{
    id: number
    issuerName: string
    commonName: string
    nameValue: string
    notBefore: string
    notAfter: string
    serialNumber: string
    sha256: string
  }>
  subdomains: string[]
  ipInfo: {
    ip: string
    country: string
    countryCode: string
    region: string
    city: string
    isp: string
    org: string
    as: string
    lat: number
    lon: number
  } | null
  summary: {
    totalRecords: number
    totalCertificates: number
    totalSubdomains: number
    hasWhois: boolean
    hasIpInfo: boolean
  }
}

interface OsintCardProps {
  target: string
  type: 'domain' | 'ip'
}

export default function OsintCard({ target, type }: OsintCardProps) {
  const [osintData, setOsintData] = useState<OsintResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const fetchOsint = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/ai/osint?q=${encodeURIComponent(target)}`)
      if (!response.ok) {
        throw new Error(`OSINT lookup failed: HTTP ${response.status}`)
      }
      const data = await response.json() as OsintResult
      setOsintData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OSINT lookup failed')
    } finally {
      setLoading(false)
    }
  }, [target])

  useEffect(() => {
    if (target) {
      fetchOsint()
    }
  }, [target, fetchOsint])

  if (!target) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-6 rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] overflow-hidden transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-foreground/[0.04] cursor-pointer hover:bg-foreground/[0.06] rounded-t-xl" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-600">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground">{type === 'domain' ? 'Domain Intelligence' : 'IP Intelligence'}</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-foreground/[0.4] hover:text-foreground transition-colors"
          aria-label={expanded ? 'Collapse OSINT details' : 'Expand OSINT details'}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {!expanded ? null : (
        <div className="px-4 py-3 border-t border-foreground/[0.06]">
          {loading && (
            <div className="flex flex-col items-center gap-2 py-4 text-center text-foreground/50">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground/[0.08] animate-pulse">
                <svg className="w-2 h-2 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M12.66 12.66l2.83 2.83M19.07 4.93l-2.83 2.83M11.34 12.66l-2.83 2.83" />
                </svg>
              </div>
              <span className="text-xs">Gathering OSINT data...</span>
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center gap-2 py-3 text-[11px] text-destructive/70">
              <svg className="w-3 h-3 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {!loading && osintData && (
            <div className="space-y-4">
              {/* DNS Records */}
              <div>
                <h4 className="text-[10px] font-bold text-foreground/50 mb-2">DNS Records</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {osintData.dns.a.length > 0 && (
                    <div className="rounded-lg bg-foreground/[0.03] p-3">
                      <span className="text-[10px] font-bold text-foreground/60">A Records</span>
                      <ul className="mt-1 space-y-1 text-[11px] text-foreground/80">
                        {osintData.dns.a.map((r) => (
                          <li key={r.value} className="font-mono truncate">
                            {r.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {osintData.dns.aaaa.length > 0 && (
                    <div className="rounded-lg bg-foreground/[0.03] p-3">
                      <span className="text-[10px] font-bold text-foreground/60">AAAA Records</span>
                      <ul className="mt-1 space-y-1 text-[11px] text-foreground/80 font-mono">
                        {osintData.dns.aaaa.map((r) => (
                          <li key={r.value} className="truncate">
                            {r.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {osintData.dns.mx.length > 0 && (
                    <div className="rounded-lg bg-foreground/[0.03] p-3">
                      <span className="text-[10px] font-bold text-foreground/60">MX Records</span>
                      <ul className="mt-1 space-y-1 text-[11px] text-foreground/80 font-mono">
                        {osintData.dns.mx.map((r) => (
                          <li key={r.value} className="truncate">
                            {r.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* WHOIS */}
              {osintData.whois && (
                <div className="rounded-lg bg-foreground/[0.03] p-3">
                  <h4 className="text-[10px] font-bold text-foreground/60 mb-2">WHOIS / RDAP</h4>
                  <div className="space-y-1 text-[11px] text-foreground/80">
                    <div className="flex justify-between">
                      <span className="font-mono">Registrar:</span>
                      <span>{osintData.whois.registrar ?? 'N/A'}</span>
                    </div>
                    {osintData.whois.registeredDate && (
                      <div className="flex justify-between">
                        <span className="font-mono">Registered:</span>
                        <span>{osintData.whois.registeredDate}</span>
                      </div>
                    )}
                    {osintData.whois.expiryDate && (
                      <div className="flex justify-between">
                        <span className="font-mono">Expires:</span>
                        <span>{osintData.whois.expiryDate}</span>
                      </div>
                    )}
                    {osintData.whois.nameServers && osintData.whois.nameServers.length > 0 && (
                      <div className="flex justify-between">
                        <span className="font-mono">Name Servers:</span>
                        <span className="font-mono truncate">{osintData.whois.nameServers.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Certificates */}
              {osintData.certificates.length > 0 && (
                <div className="rounded-lg bg-foreground/[0.03] p-3">
                  <h4 className="text-[10px] font-bold text-foreground/60 mb-2">Certificate Transparency</h4>
                  <div className="space-y-1 text-[11px] text-foreground/80">
                    {osintData.certificates.slice(0, 5).map((cert) => (
                      <div key={cert.serialNumber} className="flex justify-between">
                        <span className="font-mono truncate">{cert.commonName}</span>
                        <span className="font-mono text-[10px]">{cert.notBefore}</span>
                      </div>
                    ))}
                    {osintData.certificates.length > 5 && (
                      <span className="text-[10px] text-foreground/50">
                        +{osintData.certificates.length - 5} more certificates
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* IP Info */}
              {osintData.ipInfo && (
                <div className="rounded-lg bg-foreground/[0.03] p-3">
                  <h4 className="text-[10px] font-bold text-foreground/60 mb-2">IP Geolocation</h4>
                  <div className="flex items-start gap-3 text-[11px] text-foreground/80">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono">IP:</span>
                      <span className="font-mono">{osintData.ipInfo.ip}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono">Country:</span>
                      <span>{osintData.ipInfo.country}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono">ISP:</span>
                      <span>{osintData.ipInfo.isp}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono">AS:</span>
                      <span>{osintData.ipInfo.as}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Subdomains */}
              {osintData.subdomains.length > 0 && (
                <div className="rounded-lg bg-foreground/[0.03] p-3">
                  <h4 className="text-[10px] font-bold text-foreground/60 mb-2">Subdomains</h4>
                  <div className="flex flex-wrap gap-2">
                    {osintData.subdomains.slice(0, 10).map((subdomain) => (
                      <a
                        key={subdomain}
                        href={`https://${subdomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-foreground/[0.04] text-[11px] font-mono text-foreground/60 hover:bg-foreground/[0.08] transition-colors"
                      >
                        {subdomain}
                      </a>
                    ))}
                    {osintData.subdomains.length > 10 && (
                      <span className="text-[10px] text-foreground/50">
                        +{osintData.subdomains.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
