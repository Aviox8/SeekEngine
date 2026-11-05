import { TIME_RANGES, type TimeRangeCode } from './constants'
import { getWebSearchResults, type SearchResult } from './google-search'
import { getSerpResults } from './serpapi'
import { getExaResults } from './exa'
import { getDuckDuckGoResults } from './duckduckgo'
import { logger } from './logger'
import { isRedisConfigured, redisKeys, redisTry } from './redis'

const SEARCH_CONTEXT_TTL_MS = 15_000
const MAX_SEARCH_CACHE_ENTRIES = 100

export type SearchContextItem = Pick<SearchResult, 'title' | 'link' | 'snippet'>

export interface SearchContextResult {
  results: SearchResult[]
  provider: 'serpapi' | 'google' | 'exa' | 'duckduckgo'
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

function normalizeExaResults(
  results: Awaited<ReturnType<typeof getExaResults>>
): SearchResult[] {
  return results.map((result) => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet,
    source: result.source,
  }))
}

function normalizeDuckDuckGoResults(
  results: Awaited<ReturnType<typeof getDuckDuckGoResults>>
): SearchResult[] {
  return results.map((result) => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet,
    source: result.source,
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
  let exaResults: SearchResult[] | null = null
  let ddgResults: SearchResult[] | null = null
  let serpError: unknown
  let googleError: unknown
  let exaError: unknown
  let ddgError: unknown

  try {
    serpResults = dedupeResults(
      normalizeSerpResults(await getSerpResults(query, rangeConfig?.tbs, signal))
    )

    if (serpResults.length > 0) {
      return { results: serpResults, provider: 'serpapi' }
    }
    logger.warn('SerpApi returned no results; trying Google Custom Search', {
      query: query.slice(0, 80),
      timeRange,
    })
  } catch (error) {
    serpError = error
    logger.warn('SerpApi search failed, attempting Google fallback', {
      query: query.slice(0, 80),
      timeRange,
      reason: error instanceof Error ? error.message : String(error),
    })
  }

  try {
    googleResults = dedupeResults(
      normalizeGoogleResults(await getWebSearchResults(query, 1, rangeConfig?.dateRestrict, signal))
    )

    if (googleResults.length > 0) {
      return { results: googleResults, provider: 'google' }
    }
    logger.warn('Google Custom Search returned no results; trying Exa', {
      query: query.slice(0, 80),
      timeRange,
    })
  } catch (error) {
    googleError = error
    logger.warn('Google search fallback failed, attempting Exa', {
      query: query.slice(0, 80),
      timeRange,
      reason: error instanceof Error ? error.message : String(error),
    })
  }

  // Exa works without a time filter; its retrieval is neural, not index-based
  try {
    exaResults = dedupeResults(normalizeExaResults(await getExaResults(query, signal)))

    if (exaResults.length > 0) {
      return { results: exaResults, provider: 'exa' }
    }
    logger.warn('Exa returned no results; trying DuckDuckGo scrape', {
      query: query.slice(0, 80),
    })
  } catch (error) {
    exaError = error
    logger.warn('Exa search failed, attempting DuckDuckGo scrape', {
      query: query.slice(0, 80),
      reason: error instanceof Error ? error.message : String(error),
    })
  }

  try {
    ddgResults = dedupeResults(normalizeDuckDuckGoResults(await getDuckDuckGoResults(query, signal)))

    if (ddgResults.length > 0) {
      return { results: ddgResults, provider: 'duckduckgo' }
    }
  } catch (error) {
    ddgError = error
    logger.error('DuckDuckGo scrape failed', error instanceof Error ? error : String(error))
  }

  if (signal?.aborted) {
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException('The operation was aborted.', 'AbortError')
  }

  const failures = [serpError, googleError, exaError, ddgError].filter(Boolean)
  if (failures.length === 4) {
    logger.error('All search providers failed', new Error('serpapi + google + exa + duckduckgo all failed'), {
      query: query.slice(0, 80),
      serpApi: serpError instanceof Error ? serpError.message : String(serpError),
      googleCse: googleError instanceof Error ? googleError.message : String(googleError),
      exa: exaError instanceof Error ? exaError.message : String(exaError),
      duckduckgo: ddgError instanceof Error ? ddgError.message : String(ddgError),
    })
    throw googleError instanceof Error
      ? googleError
      : (serpError instanceof Error ? serpError : new Error('All search providers failed'))
  }

  if (ddgResults && ddgResults.length > 0) {
    return { results: ddgResults, provider: 'duckduckgo' }
  }
  if (exaResults && exaResults.length > 0) {
    return { results: exaResults, provider: 'exa' }
  }
  if (googleResults && googleResults.length > 0) {
    return { results: googleResults, provider: 'google' }
  }
  if (serpResults && serpResults.length > 0) {
    return { results: serpResults, provider: 'serpapi' }
  }

  logger.warn('All search providers returned empty result sets', {
    query: query.slice(0, 80),
    timeRange,
  })
  return { results: [], provider: 'duckduckgo' }
}

export async function getSearchContext(
  query: string,
  timeRange?: TimeRangeCode,
  signal?: AbortSignal
): Promise<SearchContextResult> {
  const cacheKey = buildCacheKey(query, timeRange)
  const now = Date.now()

  if (isRedisConfigured()) {
    const cached = await redisTry<SearchContextResult | null>('ctx get', async (r) => {
      const raw = await r.get<SearchContextResult>(redisKeys.searchContext(cacheKey))
      return raw ? { ...raw, cached: true } : null
    })
    if (cached) return cached
  } else {
    cleanupSearchCache()
    const cached = resultCache.get(cacheKey)
    if (cached && cached.expiresAt > now) {
      return { ...cached.value, cached: true }
    }
  }

  const inflight = inflightRequests.get(cacheKey)
  if (inflight) {
    return inflight
  }

  const request = loadSearchContext(query, timeRange, signal)
    .then((value) => {
      if (isRedisConfigured()) {
        void redisTry('ctx set', async (r) => {
          await r.set(redisKeys.searchContext(cacheKey), value, { ex: Math.floor(SEARCH_CONTEXT_TTL_MS / 1000) })
          return true
        })
      } else {
        resultCache.set(cacheKey, {
          value,
          expiresAt: Date.now() + SEARCH_CONTEXT_TTL_MS,
        })
      }
      return { ...value, cached: false }
    })
    .finally(() => {
      inflightRequests.delete(cacheKey)
    })

  inflightRequests.set(cacheKey, request)
  return request
}
