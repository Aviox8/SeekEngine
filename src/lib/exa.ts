/**
 * Exa Integration
 * Neural web search + citation-backed answer generation.
 * Used as (a) a search/grounding provider and (b) a last-resort LLM answer
 * provider when OpenRouter and Ollama Cloud are unavailable.
 */

import { fetchWithTimeout } from './http-utils'
import { EXTERNAL_API_TIMEOUT_MS } from './constants'
import { Errors, SeekEngineError } from './errors'
import { logger } from './logger'

const EXA_SEARCH_URL = 'https://api.exa.ai/search'
const EXA_ANSWER_URL = 'https://api.exa.ai/answer'

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

export interface ExaAnswerResult {
  answer: string
  citations: Array<{ title: string; url: string; publishedDate?: string | null }>
}

interface ExaAnswerResponse {
  answer?: string
  citations?: Array<{ title?: string | null; url?: string; publishedDate?: string | null }>
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

/**
 * Ask Exa's answer API for a citation-backed answer.
 * Non-streaming; callers should treat this as one large token.
 */
export async function getExaAnswer(
  query: string,
  systemPrompt?: string,
  signal?: AbortSignal
): Promise<ExaAnswerResult> {
  const apiKey = exaKey()
  const model = process.env.EXA_ANSWER_MODEL || 'exa-fast'

  try {
    const response = await fetchWithTimeout(
      EXA_ANSWER_URL,
      30_000,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          query,
          model,
          ...(systemPrompt ? { systemPrompt } : {}),
        }),
        signal,
      }
    )

    if (!response.ok) {
      logger.warn('Exa answer request failed', { status: response.status })
      throw Errors.externalApiFailed('Exa', response.status)
    }

    const data = (await response.json()) as ExaAnswerResponse
    if (!data.answer || !data.answer.trim()) {
      throw Errors.externalApiFailed('Exa')
    }

    return {
      answer: data.answer.trim(),
      citations: (data.citations ?? [])
        .filter((c): c is { title?: string | null; url: string; publishedDate?: string | null } =>
          typeof c.url === 'string' && c.url.length > 0
        )
        .map((c) => ({
          title: c.title?.trim() || c.url,
          url: c.url,
          publishedDate: c.publishedDate ?? null,
        })),
    }
  } catch (error) {
    if (signal?.aborted) throw error
    if (error instanceof SeekEngineError) throw error
    if ((error as Error).name === 'AbortError') {
      throw Errors.timeout('Exa', 30_000)
    }

    logger.error('Exa answer failed', error instanceof Error ? error : String(error))
    throw Errors.externalApiFailed('Exa')
  }
}
