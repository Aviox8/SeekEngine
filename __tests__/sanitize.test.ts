/**
 * Tests for Input Sanitization Utilities
 * Tests protection against injection and malformed input
 */

import { describe, it, expect } from 'vitest'
import { sanitizeSearchQuery } from '@/lib/sanitize'

describe('sanitizeSearchQuery', () => {
  it('removes newlines and collapses whitespace', () => {
    const query = 'what  is\n  quantum\n\ncomputing'
    const result = sanitizeSearchQuery(query)
    expect(result).toBe('what is quantum computing')
  })

  it('removes dangerous characters', () => {
    const query = 'query<script>alert(1)</script>'
    const result = sanitizeSearchQuery(query)
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })

  it('trims whitespace', () => {
    const query = '  quantum computing  '
    const result = sanitizeSearchQuery(query)
    expect(result).toBe('quantum computing')
  })

  it('throws on non-string input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => sanitizeSearchQuery(123 as any)).toThrow()
  })

  it('preserves legitimate query structure', () => {
    const query = 'how to make quantum computers?'
    const result = sanitizeSearchQuery(query)
    expect(result).toBe('how to make quantum computers')
  })
})

