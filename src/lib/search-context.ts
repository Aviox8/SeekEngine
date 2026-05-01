import { TIME_RANGES, type TimeRangeCode } from './constants'
import { getWebSearchResults, type SearchResult } from './google-search'
import { getSerpResults } from './serpapi'
import { logger } from './logger'

const SEARCH_CONTEXT_TTL_MS = 15_000
const MAX_SEARCH_CACHE_ENTRIES = 100

export type SearchContextItem = Pick<SearchResult, 'title' | 'link' | 'snippet'>

export interface SearchContextResult {
  results: SearchResult[]
  provider: 'serpapi' | 'google'
  cached: boolean
}

interface SearchContextCacheEntry {
  value: Omit<SearchContextResult, 'cached'>
  expiresAt: number
}

const resultCache = new Map<string, SearchContextCacheEntry>()
const inflightRequests = new Map<string, Promise<SearchContextResult>>()

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ')
}

function buildCacheKey(query: string, timeRange?: TimeRangeCode): string {
  return `${timeRange ?? 'all'}:${normalizeQuery(query)}`
}

function cleanupSearchCache() {
  const now = Date.now()

  for (const [key, entry] of resultCache.entries()) {
    if (entry.expiresAt <= now) {
      resultCache.delete(key)
    }
  }

  if (resultCache.size <= MAX_SEARCH_CACHE_ENTRIES) {
    return
  }

  const keys = Array.from(resultCache.keys())
  const toDelete = resultCache.size - MAX_SEARCH_CACHE_ENTRIES
  for (let i = 0; i < toDelete; i++) {
    const key = keys[i]
    if (key) {
      resultCache.delete(key)
    }
  }
}

function dedupeResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>()
  const deduped: SearchResult[] = []

  for (const result of results) {
    if (!result.link || seen.has(result.link)) {
      continue
    }
    seen.add(result.link)
    deduped.push(result)
  }

  return deduped
}

function normalizeSerpResults(
  results: Awaited<ReturnType<typeof getSerpResults>>
): SearchResult[] {
  return results.map((result) => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet,
    source: result.source,
  }))
}

function normalizeGoogleResults(
  results: Awaited<ReturnType<typeof getWebSearchResults>>
): SearchResult[] {
  return results.map((result) => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet,
    displayLink: result.displayLink,
    source: result.source || result.displayLink || '',
  }))
}

async function loadSearchContext(
  query: string,
  timeRange?: TimeRangeCode,
  signal?: AbortSignal
): Promise<Omit<SearchContextResult, 'cached'>> {
  const rangeConfig = timeRange ? TIME_RANGES[timeRange] : undefined

  let serpResults: SearchResult[] | null = null
  let googleResults: SearchResult[] | null = null
  let serpError: unknown
  let googleError: unknown

  try {
    serpResults = dedupeResults(
      normalizeSerpResults(await getSerpResults(query, rangeConfig?.tbs, signal))
    )

    if (serpResults.length > 0) {
      return { results: serpResults, provider: 'serpapi' }
    }
  } catch (error) {
    serpError = error
    logger.warn('SerpApi search failed, attempting Google fallback', {
      query: query.slice(0, 80),
      timeRange,
    })
  }

  try {
    googleResults = dedupeResults(
      normalizeGoogleResults(await getWebSearchResults(query, 1, rangeConfig?.dateRestrict, signal))
    )

    if (googleResults.length > 0) {
      return { results: googleResults, provider: 'google' }
    }
  } catch (error) {
    googleError = error
    logger.warn('Google search fallback failed', {
      query: query.slice(0, 80),
      timeRange,
    })
  }

  if (signal?.aborted) {
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException('The operation was aborted.', 'AbortError')
  }

  if (serpError && googleError) {
    throw googleError instanceof Error ? googleError : serpError
  }

  if (googleResults) {
    return { results: googleResults, provider: 'google' }
  }

  if (serpResults) {
    return { results: serpResults, provider: 'serpapi' }
  }

  return { results: [], provider: 'google' }
}

export async function getSearchContext(
  query: string,
  timeRange?: TimeRangeCode,
  signal?: AbortSignal
): Promise<SearchContextResult> {
  cleanupSearchCache()

  const cacheKey = buildCacheKey(query, timeRange)
  const now = Date.now()
  const cached = resultCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return { ...cached.value, cached: true }
  }

  const inflight = inflightRequests.get(cacheKey)
  if (inflight) {
    return inflight
  }

  const request = loadSearchContext(query, timeRange, signal)
    .then((value) => {
      resultCache.set(cacheKey, {
        value,
        expiresAt: Date.now() + SEARCH_CONTEXT_TTL_MS,
      })
      return { ...value, cached: false }
    })
    .finally(() => {
      inflightRequests.delete(cacheKey)
    })

  inflightRequests.set(cacheKey, request)
  return request
}
