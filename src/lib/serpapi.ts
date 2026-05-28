/**
 * SerpApi Google Search Integration
 * Provides high-fidelity, real-time Google search results
 */

import { ENV } from './env'
import { EXTERNAL_API_TIMEOUT_MS } from './constants'
import { fetchWithTimeout } from './http-utils'
import { Errors, SeekEngineError } from './errors'
import { logger } from './logger'

const SERPAPI_KEY = ENV.SERPAPI_KEY
const SERPAPI_URL = 'https://serpapi.com/search'

export interface SerpResult {
  title: string
  link: string
  snippet: string
  source: string
}

interface SerpOrganicResult {
  title?: string
  link?: string
  snippet?: string
  source?: string
  display_link?: string
  about_this_result?: {
    source?: {
      description?: string
    }
  }
}

interface SerpApiResponse {
  organic_results?: SerpOrganicResult[]
}

/**
 * Fetch real-time search results from SerpApi
 */
export async function getSerpResults(
  query: string,
  timeRange?: string,
  signal?: AbortSignal
): Promise<SerpResult[]> {
  if (!SERPAPI_KEY) {
    throw Errors.apiKeyMissing('SerpApi')
  }

  try {
    const url = new URL(SERPAPI_URL)
    url.searchParams.append('q', query)
    url.searchParams.append('api_key', SERPAPI_KEY)
    url.searchParams.append('engine', 'google')
    url.searchParams.append('num', '8')
    if (timeRange) url.searchParams.append('tbs', timeRange)

    // IMPROVED: Use shared fetchWithTimeout helper to prevent hanging requests
    // Centralizes timeout logic and reduces code duplication
    const response = await fetchWithTimeout(url, EXTERNAL_API_TIMEOUT_MS, { signal })

    if (!response.ok) {
      throw Errors.externalApiFailed('SerpApi', response.status)
    }

    const data: SerpApiResponse = await response.json()

    if (!data.organic_results) {
      return []
    }

    return data.organic_results
      .filter((item): item is Required<Pick<SerpOrganicResult, 'title' | 'link'>> & SerpOrganicResult =>
        typeof item.title === 'string' &&
        typeof item.link === 'string'
      )
      .map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet || item.about_this_result?.source?.description || '',
        source: item.source || item.display_link || '',
      }))
  } catch (error) {
    if (signal?.aborted) {
      throw error
    }

    if (error instanceof SeekEngineError) {
      throw error
    }

    if ((error as Error).name === 'AbortError') {
      throw Errors.timeout('SerpApi', EXTERNAL_API_TIMEOUT_MS)
    }

    logger.error(
      'SerpApi request failed',
      error instanceof Error ? error : String(error),
    )
    throw Errors.externalApiFailed('SerpApi')
  }
}
