/**
 * Google Custom Search Integration
 * Handles traditional web search results
 */

import { ENV } from './env'
import { EXTERNAL_API_TIMEOUT_MS } from './constants'
import { fetchWithTimeout } from './http-utils'
import { Errors, SeekEngineError } from './errors'
import { logger } from './logger'

const GOOGLE_API_KEY = ENV.GOOGLE_SEARCH_API_KEY
const GOOGLE_CX = ENV.GOOGLE_SEARCH_CX
const GOOGLE_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1'

export interface SearchResult {
  title: string
  link: string
  snippet: string
  displayLink?: string
  source?: string
}

/**
 * Fetch web search results from Google Custom Search
 * @param query - The search query
 * @param startIndex - Pagination start index (default: 1)
 * @returns Array of search results
 */
export async function getWebSearchResults(
  query: string,
  startIndex: number = 1,
  dateRestrict?: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    throw Errors.apiKeyMissing('Google Custom Search')
  }

  try {
    const url = new URL(GOOGLE_SEARCH_URL)
    url.searchParams.append('q', query)
    url.searchParams.append('key', GOOGLE_API_KEY)
    url.searchParams.append('cx', GOOGLE_CX)
    url.searchParams.append('start', startIndex.toString())
    url.searchParams.append('num', '10')
    if (dateRestrict) url.searchParams.append('dateRestrict', dateRestrict)

    // IMPROVED: Use shared fetchWithTimeout helper to prevent hanging requests
    // Centralizes timeout logic and reduces code duplication
    const response = await fetchWithTimeout(url, EXTERNAL_API_TIMEOUT_MS, { signal })

    if (!response.ok) {
      throw Errors.externalApiFailed('Google Custom Search', response.status)
    }

    const data = await response.json()

    if (!data.items) {
      return []
    }

    return data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
    }))
      } catch (error) {
    if (signal?.aborted) {
      throw error
    }

    if (error instanceof SeekEngineError) {
      throw error
    }

    if ((error as Error).name === 'AbortError') {
      throw Errors.timeout('Google Custom Search', EXTERNAL_API_TIMEOUT_MS)
    }

    logger.error(
      'Google Custom Search request failed',
      error instanceof Error ? error : String(error),
    )
    throw Errors.externalApiFailed('Google Custom Search')
  }
}
