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
