/**
 * Tests for Error Handling & Utilities
 * Tests error creation, standardized responses, and error factories
 */

import { describe, it, expect } from 'vitest'
import { 
  SeekEngineError, 
  createErrorResponse, 
  isRetryable,
  Errors 
} from '@/lib/errors'

describe('SeekEngineError', () => {
  it('creates error with correct properties', () => {
    const error = new SeekEngineError(
      'Test error',
      'INVALID_QUERY',
      400,
      false
    )

    expect(error.message).toBe('Test error')
    expect(error.code).toBe('INVALID_QUERY')
    expect(error.status).toBe(400)
    expect(error.retryable).toBe(false)
  })

  it('includes context in error', () => {
    const error = new SeekEngineError(
      'API failed',
      'EXTERNAL_API_FAILED',
      502,
      true,
      { apiName: 'SerpAPI', statusCode: 503 }
    )

    expect(error.context).toEqual({ apiName: 'SerpAPI', statusCode: 503 })
  })
})

describe('createErrorResponse', () => {
  it('formats SeekEngineError correctly', () => {
    const error = new SeekEngineError(
      'Rate limited',
      'RATE_LIMIT_EXCEEDED',
      429,
      true
    )

    const response = createErrorResponse(error)

    expect(response.status).toBe(429)
    expect(response.error.code).toBe('RATE_LIMIT_EXCEEDED')
    expect(response.error.message).toBe('Rate limited')
    expect(response.error.retryable).toBe(true)
  })

  it('handles generic Error objects', () => {
    const error = new Error('Generic error')
    const response = createErrorResponse(error)

    expect(response.status).toBe(500)
    expect(response.error.code).toBe('INTERNAL_ERROR')
  })

  it('handles unknown error types', () => {
    const response = createErrorResponse('unknown error string')

    expect(response.status).toBe(500)
    expect(response.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('isRetryable', () => {
  it('returns true for retryable SeekEngineError', () => {
    const error = new SeekEngineError('Timeout', 'TIMEOUT', 504, true)
    expect(isRetryable(error)).toBe(true)
  })

  it('returns false for non-retryable SeekEngineError', () => {
    const error = new SeekEngineError('Bad query', 'INVALID_QUERY', 400, false)
    expect(isRetryable(error)).toBe(false)
  })

  it('returns true for network errors', () => {
    const error = new TypeError('fetch failed')
    expect(isRetryable(error)).toBe(true)
  })

  it('returns false for other errors', () => {
    const error = new Error('Some other error')
    expect(isRetryable(error)).toBe(false)
  })
})

describe('Errors factory', () => {
  it('creates invalid query error', () => {
    const error = Errors.invalidQuery('Query too short')
    expect(error.code).toBe('INVALID_QUERY')
    expect(error.status).toBe(400)
    expect(error.retryable).toBe(false)
  })

  it('creates rate limit error with retry info', () => {
    const error = Errors.rateLimitExceeded(120)
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
    expect(error.status).toBe(429)
    expect(error.retryable).toBe(true)
    expect(error.context?.retryAfter).toBe(120)
  })

  it('creates API key missing error', () => {
    const error = Errors.apiKeyMissing('OPENROUTER_API_KEY')
    expect(error.code).toBe('API_KEY_MISSING')
    expect(error.message).toContain('OPENROUTER_API_KEY')
  })

  it('creates external API failed error', () => {
    const error = Errors.externalApiFailed('SerpAPI', 503)
    expect(error.code).toBe('EXTERNAL_API_FAILED')
    expect(error.status).toBe(502)
    expect(error.retryable).toBe(true)
    expect(error.context?.statusCode).toBe(503)
  })

  it('creates timeout error', () => {
    const error = Errors.timeout('OpenRouter', 30000)
    expect(error.code).toBe('TIMEOUT')
    expect(error.status).toBe(504)
    expect(error.retryable).toBe(true)
  })

  it('creates invalid input error', () => {
    const error = Errors.invalidInput('query', 'Contains invalid characters')
    expect(error.code).toBe('INVALID_INPUT')
    expect(error.status).toBe(400)
    expect(error.context?.field).toBe('query')
  })
})
