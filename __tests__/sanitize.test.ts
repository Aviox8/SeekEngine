/**
 * Tests for Input Sanitization Utilities
 * Tests protection against injection and malformed input
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeSearchQuery,
  isValidUTF8,
  sanitizeUrlParam,
  isValidDomain,
  hasRiskySQLPatterns,
  sanitizeApiKey,
} from '@/lib/sanitize'

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
    expect(() => sanitizeSearchQuery(123 as any)).toThrow()
  })

  it('preserves legitimate query structure', () => {
    const query = 'how to make quantum computers?'
    const result = sanitizeSearchQuery(query)
    expect(result).toBe('how to make quantum computers')
  })
})

describe('isValidUTF8', () => {
  it('returns true for valid UTF-8 strings', () => {
    expect(isValidUTF8('Hello world')).toBe(true)
    expect(isValidUTF8('Quantum 量子 컴퓨터')).toBe(true)
    expect(isValidUTF8('🚀 emoji 🎉')).toBe(true)
  })

  it('returns true for empty string', () => {
    expect(isValidUTF8('')).toBe(true)
  })

  it('handles complex unicode', () => {
    const complexUnicode = 'A\u0300\u0301\u0302' // Combining diacriticals
    expect(isValidUTF8(complexUnicode)).toBe(true)
  })
})

describe('sanitizeUrlParam', () => {
  it('encodes special characters', () => {
    const param = 'hello world & special'
    const result = sanitizeUrlParam(param)
    expect(result).toContain('%20')
    expect(result).toContain('%26')
  })

  it('removes dangerous characters', () => {
    const param = 'param<>script'
    const result = sanitizeUrlParam(param)
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })

  it('returns empty string for non-string input', () => {
    expect(sanitizeUrlParam(undefined as any)).toBe('')
    expect(sanitizeUrlParam(null as any)).toBe('')
  })
})

describe('isValidDomain', () => {
  it('validates legitimate domains', () => {
    expect(isValidDomain('example.com')).toBe(true)
    expect(isValidDomain('sub.domain.example.com')).toBe(true)
    expect(isValidDomain('test-domain.org')).toBe(true)
    expect(isValidDomain('a.co')).toBe(true)
  })

  it('rejects invalid domains', () => {
    expect(isValidDomain('')).toBe(false)
    expect(isValidDomain('example')).toBe(false)
    expect(isValidDomain('example..com')).toBe(false)
    expect(isValidDomain('.example.com')).toBe(false)
    expect(isValidDomain('example.com.')).toBe(false)
  })
})

describe('hasRiskySQLPatterns', () => {
  it('detects SQL injection attempts', () => {
    expect(hasRiskySQLPatterns("' OR '1'='1")).toBe(true)
    expect(hasRiskySQLPatterns('DROP TABLE users')).toBe(true)
    expect(hasRiskySQLPatterns('UNION SELECT')).toBe(true)
    expect(hasRiskySQLPatterns('--comment')).toBe(true)
    expect(hasRiskySQLPatterns('/* comment */')).toBe(true)
  })

  it('allows safe queries', () => {
    expect(hasRiskySQLPatterns('how to cook pasta')).toBe(false)
    expect(hasRiskySQLPatterns('best machine learning libraries')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(hasRiskySQLPatterns('drop table users')).toBe(true)
    expect(hasRiskySQLPatterns('DROP TABLE USERS')).toBe(true)
  })
})

describe('sanitizeApiKey', () => {
  it('keeps valid API key characters', () => {
    const key = 'sk-1234567890abcdef_test-key'
    const result = sanitizeApiKey(key)
    expect(result).toBe(key)
  })

  it('removes special characters from API key', () => {
    const key = 'sk-1234<>;:"'
    const result = sanitizeApiKey(key)
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
  })

  it('throws on empty key', () => {
    expect(() => sanitizeApiKey('')).toThrow()
  })

  it('throws on non-string', () => {
    expect(() => sanitizeApiKey(undefined as any)).toThrow()
  })
})
