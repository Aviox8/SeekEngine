import { describe, it, expect } from 'vitest'
import { validateSearchQuery } from '../src/lib/validation'

describe('validateSearchQuery', () => {
  it('rejects empty query', () => {
    const params = new URLSearchParams()
    expect(validateSearchQuery(params).valid).toBe(false)
  })

  it('rejects whitespace-only query', () => {
    const params = new URLSearchParams({ q: '   ' })
    expect(validateSearchQuery(params).valid).toBe(false)
  })

  it('accepts single character query', () => {
    const params = new URLSearchParams({ q: 'a' })
    const result = validateSearchQuery(params)
    expect(result.valid).toBe(true)
    expect(result.query).toBe('a')
  })

  it('rejects query > 500 chars', () => {
    const params = new URLSearchParams({ q: 'a'.repeat(501) })
    expect(validateSearchQuery(params).valid).toBe(false)
  })

  it('accepts valid query', () => {
    const params = new URLSearchParams({ q: 'quantum computing' })
    const result = validateSearchQuery(params)
    expect(result.valid).toBe(true)
    expect(result.query).toBe('quantum computing')
  })

  it('trims valid query', () => {
    const params = new URLSearchParams({ q: '  hello world  ' })
    const result = validateSearchQuery(params)
    expect(result.valid).toBe(true)
    expect(result.query).toBe('hello world')
  })
})
