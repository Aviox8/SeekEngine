/**
 * API Validation
 * Queries, time ranges, and AI response schemas (zod-validated)
 */

import { z } from 'zod'
import { TIME_RANGES, QUERY_MIN_LENGTH, QUERY_MAX_LENGTH, type TimeRangeCode } from './constants'

// AI suggestion response (validated at the model boundary)
export const suggestionsResponseSchema = z.object({
  suggestions: z.array(z.string()).default([]),
})

// Validate search query from URL params
export function validateSearchQuery(searchParams: URLSearchParams): {
  valid: boolean
  query?: string
  error?: string
} {
  return validateSearchQueryValue(searchParams.get('q'))
}

export function validateSearchQueryValue(q: string | null | undefined): {
  valid: boolean
  query?: string
  error?: string
} {
  if (!q || q.trim().length === 0) {
    return { valid: false, error: 'Query is required' }
  }

  if (q.length > QUERY_MAX_LENGTH) {
    return { valid: false, error: `Query too long (max ${QUERY_MAX_LENGTH} characters)` }
  }

  if (q.trim().length < QUERY_MIN_LENGTH) {
    return { valid: false, error: `Query must be at least ${QUERY_MIN_LENGTH} character` }
  }

  return { valid: true, query: q.trim() }
}

export function validateTimeRange(value: string | null | undefined): {
  valid: boolean
  timeRange?: TimeRangeCode
  error?: string
} {
  if (!value) {
    return { valid: true }
  }

  if (value in TIME_RANGES) {
    return { valid: true, timeRange: value as TimeRangeCode }
  }

  return {
    valid: false,
    error: `Invalid time range: ${value}. Valid values: ${Object.keys(TIME_RANGES).join(', ')}`,
  }
}
