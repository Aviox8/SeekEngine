/**
 * HTTP Utilities
 * Shared fetch patterns for timeout handling and error management
 */

import { EXTERNAL_API_TIMEOUT_MS } from './constants'

/**
 * Fetch with automatic timeout
 * Aborts request if it exceeds timeout duration
 * 
 * @param url - URL to fetch
 * @param timeoutMs - Timeout in milliseconds (default: EXTERNAL_API_TIMEOUT_MS)
 * @param options - Additional fetch options
 * @returns Fetch response
 * 
 * @example
 * const response = await fetchWithTimeout('https://api.example.com/data')
 * const data = await response.json()
 */
export async function fetchWithTimeout(
  url: string | URL,
  timeoutMs: number = EXTERNAL_API_TIMEOUT_MS,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController()
  const externalSignal = options?.signal
  const onAbort = () => controller.abort(externalSignal?.reason)
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    if (externalSignal?.aborted) {
      controller.abort(externalSignal.reason)
    } else if (externalSignal) {
      externalSignal.addEventListener('abort', onAbort, { once: true })
    }

    const response = await fetch(url.toString(), {
      ...options,
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }
    return response
  } finally {
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onAbort)
    }
    clearTimeout(timeout)
  }
}

/**
 * Type-safe fetch with JSON response parsing and error handling
 * 
 * @param url - URL to fetch
 * @param parser - Function to parse response (usually res => res.json())
 * @param onError - Optional error callback
 * @returns Parsed JSON response or null on error
 */
export async function fetchJSON<T>(
  url: string | URL,
  parser: (res: Response) => Promise<T> = (res) => res.json(),
  onError?: (error: Error) => void
): Promise<T | null> {
  try {
    const response = await fetchWithTimeout(url)
    
    if (!response.ok) {
      console.error(`HTTP ${response.status}: ${response.statusText}`)
      return null
    }
    
    return await parser(response)
  } catch (error) {
    const err = error as Error
    if (err.name === 'AbortError') {
      console.error('Request timeout')
      onError?.(err)
    } else {
      console.error('Fetch error:', err.message)
      onError?.(err)
    }
    return null
  }
}
