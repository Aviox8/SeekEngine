/**
 * Error Handling Utilities
 * Standardized error types, responses, and logging
 */

export type ErrorCode = 
  | 'INVALID_QUERY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'API_KEY_MISSING'
  | 'EXTERNAL_API_FAILED'
  | 'MODEL_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_INPUT'
  | 'INTERNAL_ERROR'

export interface AppError extends Error {
  code: ErrorCode
  status: number
  retryable: boolean
  context?: Record<string, unknown>
}

export class SeekEngineError extends Error implements AppError {
  constructor(
    message: string,
    public code: ErrorCode,
    public status: number = 500,
    public retryable: boolean = false,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'SeekEngineError'
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown): {
  error: {
    code: ErrorCode
    message: string
    retryable: boolean
  }
  status: number
} {
  if (error instanceof SeekEngineError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      },
      status: error.status,
    }
  }

  if (error instanceof Error) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : (error.message || 'An unexpected error occurred'),
        retryable: false,
      },
      status: 500,
    }
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unknown error occurred',
      retryable: false,
    },
    status: 500,
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof SeekEngineError) {
    return error.retryable
  }
  // Network errors are generally retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  return false
}

/**
 * Common error factory functions
 */
export const Errors = {
  invalidQuery: (message: string = 'Invalid search query') =>
    new SeekEngineError(message, 'INVALID_QUERY', 400, false),

  rateLimitExceeded: (retryAfter: number = 60) =>
    new SeekEngineError(
      `Rate limit exceeded. Retry after ${retryAfter}s`,
      'RATE_LIMIT_EXCEEDED',
      429,
      true,
      { retryAfter }
    ),

  apiKeyMissing: (keyName: string) =>
    new SeekEngineError(
      `${keyName} is not configured`,
      'API_KEY_MISSING',
      500,
      false
    ),

  externalApiFailed: (apiName: string, statusCode?: number) =>
    new SeekEngineError(
      `${apiName} request failed${statusCode ? ` (${statusCode})` : ''}`,
      'EXTERNAL_API_FAILED',
      502,
      true,
      { apiName, statusCode }
    ),

  modelUnavailable: () =>
    new SeekEngineError(
      'No models available at this time',
      'MODEL_UNAVAILABLE',
      503,
      true
    ),

  timeout: (service: string, timeoutMs: number) =>
    new SeekEngineError(
      `${service} request timed out after ${timeoutMs}ms`,
      'TIMEOUT',
      504,
      true,
      { service, timeoutMs }
    ),

  invalidInput: (field: string, reason: string) =>
    new SeekEngineError(
      `Invalid ${field}: ${reason}`,
      'INVALID_INPUT',
      400,
      false,
      { field }
    ),
}
