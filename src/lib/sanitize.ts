/**
 * Input Sanitization Utilities
 * Protect against injection attacks and malformed input
 */

import { UNSAFE_CHARS_REGEX, NEWLINE_REGEX, WHITESPACE_COLLAPSE_REGEX } from './constants'

/**
 * Sanitize a search query for external APIs
 * - Remove newlines
 * - Collapse multiple spaces
 * - Remove potentially dangerous characters
 * - Trim whitespace
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') {
    throw new Error('Query must be a string')
  }

  return query
    .replace(NEWLINE_REGEX, ' ') // Replace newlines with spaces
    .replace(WHITESPACE_COLLAPSE_REGEX, ' ') // Collapse multiple spaces
    .replace(UNSAFE_CHARS_REGEX, '') // Remove dangerous chars
    .replace(/[?!]/g, '') // Normalize trailing query punctuation
    .trim()
}

/**
 * Validate UTF-8 encoding
 */
export function isValidUTF8(str: string): boolean {
  try {
    const encoded = new TextEncoder().encode(str)
    new TextDecoder().decode(encoded)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize URL query parameters
 */
export function sanitizeUrlParam(param: string): string {
  if (typeof param !== 'string') {
    return ''
  }
  return encodeURIComponent(param.replace(UNSAFE_CHARS_REGEX, ''))
}

/**
 * Validate domain is legitimate
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/
  return domainRegex.test(domain)
}

/**
 * Sanitize JSON for safe display (prevent XSS)
 */
export function sanitizeJSON(obj: unknown): string {
  try {
    const json = JSON.stringify(obj)
    return json
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  } catch {
    return '{}'
  }
}

/**
 * Detect potential SQL injection patterns
 */
export function hasRiskySQLPatterns(input: string): boolean {
  const riskyPatterns = [
    /('|(--)|;|\*\/|(\/\*))/i, // SQL comments/semicolons
    /union/i,
    /select/i,
    /insert/i,
    /update/i,
    /delete/i,
    /drop/i,
    /create/i,
    /alter/i,
  ]
  return riskyPatterns.some(pattern => pattern.test(input))
}

/**
 * Sanitize and validate API key
 */
export function sanitizeApiKey(key: string): string {
  if (typeof key !== 'string' || key.length === 0) {
    throw new Error('Invalid API key format')
  }
  // API keys should be alphanumeric with hyphens/underscores
  return key.replace(/[^a-zA-Z0-9_-]/g, '')
}
