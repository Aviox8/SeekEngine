/**
 * Exa Integration
 * Neural web search. Used as the search/grounding provider when
 * SerpAPI and Google CSE return no results.
 */

import { fetchWithTimeout } from './http-utils'
import { EXTERNAL_API_TIMEOUT_MS } from './constants'
import { Errors, SeekEngineError } from './errors'
import { logger } from './logger'

const EXA_SEARCH_URL = 'https://api.exa.ai/search'

export interface ExaResult {
  title: string
  link: string
  snippet: string
  source: string
}

interface ExaSearchItem {
  title?: string | null
  url?: string
  id?: string
  highlights?: string[]
  summary?: string | null
  publishedDate?: string | null
}

interface ExaSearchResponse {
  results?: ExaSearchItem[]
}

function exaKey(): string {
  const key = process.env.EXA_API_KEY
  if (!key) {
    throw Errors.apiKeyMissing('Exa')
  }
  return key
}

function firstText(summary?: string | null, highlights?: string[]): string {
  if (summary && summary.trim()) return summary.trim()
  if (highlights && highlights.length > 0) {
    return highlights.map(h => h.trim()).filter(Boolean).join(' ').trim()
  }
  return ''
}

export async function getExaResults(
  query: string,
  signal?: AbortSignal
): Promise<ExaResult[]> {
  const apiKey = exaKey()

  try {
    const response = await fetchWithTimeout(
      EXA_SEARCH_URL,
      EXTERNAL_API_TIMEOUT_MS,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          query,
          type: 'auto',
          numResults: 8,
          contents: { highlights: true },
        }),
        signal,
      }
    )

    if (!response.ok) {
      logger.warn('Exa search request failed', { status: response.status })
      throw Errors.externalApiFailed('Exa', response.status)
    }

    const data = (await response.json()) as ExaSearchResponse
    const results = data.results ?? []

    return results
      .map((item) => ({
        title: item.title?.trim() || '',
        link: item.url || item.id || '',
        snippet: firstText(item.summary, item.highlights),
        source: 'exa',
      }))
      .filter((item) => item.title && item.link)
  } catch (error) {
    if (signal?.aborted) throw error
    if (error instanceof SeekEngineError) throw error
    if ((error as Error).name === 'AbortError') {
      throw Errors.timeout('Exa', EXTERNAL_API_TIMEOUT_MS)
    }

    logger.error('Exa search failed', error instanceof Error ? error : String(error))
    throw Errors.externalApiFailed('Exa')
  }
}

