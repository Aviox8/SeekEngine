import { afterEach, describe, it, expect } from 'vitest'
import { checkRateLimit, getClientIP, type RateLimitConfig } from '../src/lib/rate-limit'

const config: RateLimitConfig = { maxRequests: 3, windowMs: 60_000 }
const originalNodeEnv = process.env.NODE_ENV

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `test-allow-${Date.now()}`
    expect(checkRateLimit(key, config).allowed).toBe(true)
    expect(checkRateLimit(key, config).allowed).toBe(true)
    expect(checkRateLimit(key, config).allowed).toBe(true)
  })

  it('blocks requests over the limit', () => {
    const key = `test-block-${Date.now()}`
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    checkRateLimit(key, config)
    const result = checkRateLimit(key, config)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('returns correct remaining count', () => {
    const key = `test-remaining-${Date.now()}`
    const r1 = checkRateLimit(key, config)
    expect(r1.remaining).toBe(2)
    const r2 = checkRateLimit(key, config)
    expect(r2.remaining).toBe(1)
  })
})

describe('getClientIP', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('prefers trusted platform headers', () => {
    process.env.NODE_ENV = 'production'
    const request = new Request('https://example.com', {
      headers: {
        'x-vercel-forwarded-for': '203.0.113.10',
        'x-forwarded-for': '198.51.100.10',
      },
    })

    expect(getClientIP(request)).toBe('203.0.113.10')
  })

  it('ignores spoofable forwarding headers in production', () => {
    process.env.NODE_ENV = 'production'
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '198.51.100.10',
        'x-real-ip': '203.0.113.20',
      },
    })

    expect(getClientIP(request)).toBe('unknown')
  })

  it('allows forwarded header fallback during development', () => {
    process.env.NODE_ENV = 'development'
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '198.51.100.10, 203.0.113.20',
      },
    })

    expect(getClientIP(request)).toBe('198.51.100.10')
  })
})
