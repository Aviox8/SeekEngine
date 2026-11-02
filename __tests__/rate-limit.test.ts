import { afterEach, describe, it, expect } from 'vitest'
import { checkRateLimit, getClientIP, type RateLimitConfig } from '../src/lib/rate-limit'

const config: RateLimitConfig = { maxRequests: 3, windowMs: 60_000 }
const originalNodeEnv = process.env.NODE_ENV

/** NODE_ENV is readonly in @types/node — assign through a widened view */
function setNodeEnv(value: string) {
  ;(process.env as Record<string, string | undefined>).NODE_ENV = value
}

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
    setNodeEnv(originalNodeEnv ?? 'test')
  })

  it('prefers trusted platform headers', () => {
    setNodeEnv('production')
    const request = new Request('https://example.com', {
      headers: {
        'x-vercel-forwarded-for': '203.0.113.10',
        'x-forwarded-for': '198.51.100.10',
      },
    })

    expect(getClientIP(request)).toBe('203.0.113.10')
  })

  it('falls back to x-forwarded-for when no platform header is present', () => {
    // On Vercel's edge the platform rewrites x-forwarded-for, so it is a
    // reliable fallback that prevents all clients sharing one 'unknown' bucket
    setNodeEnv('production')
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '198.51.100.10',
      },
    })

    expect(getClientIP(request)).toBe('198.51.100.10')
  })

  it('falls back to x-real-ip when only it is present', () => {
    setNodeEnv('production')
    const request = new Request('https://example.com', {
      headers: {
        'x-real-ip': '203.0.113.20',
      },
    })

    expect(getClientIP(request)).toBe('203.0.113.20')
  })

  it('takes the first hop of a multi-value forwarded header', () => {
    setNodeEnv('production')
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '198.51.100.10, 203.0.113.20',
      },
    })

    expect(getClientIP(request)).toBe('198.51.100.10')
  })

  it('returns unknown when no usable IP headers exist', () => {
    setNodeEnv('production')
    const request = new Request('https://example.com')

    expect(getClientIP(request)).toBe('unknown')
  })

  it('allows forwarded header fallback during development', () => {
    setNodeEnv('development')
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '198.51.100.10, 203.0.113.20',
      },
    })

    expect(getClientIP(request)).toBe('198.51.100.10')
  })
})
