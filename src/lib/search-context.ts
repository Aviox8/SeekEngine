import { TIME_RANGES, type TimeRangeCode } from './constants'
import { getWebSearchResults, type SearchResult } from './google-search'
import { getSerpResults } from './serpapi'
import { getExaResults } from './exa'
import { getDuckDuckGoResults } from './duckduckgo'
import { logger } from './logger'
import { isRedisConfigured, redisKeys, redisTry } from './redis'

const SEARCH_CONTEXT_TTL_MS = 15_000
const MAX_SEARCH_CACHE_ENTRIES = 100
const MAX_GROUNDING_RESULTS = 12

export type SearchContextItem = Pick<SearchResult, 'title' | 'link' | 'snippet'>

export interface SearchContextResult {
  results: SearchResult[]
  provider: 'serpapi' | 'google' | 'exa' | 'duckduckgo' | 'merged'
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

  // Parallel fan-out: every configured provider is queried on each search,
  // never sequentially. Exa leads the merged order — it is the primary
  // OSINT grounding path (neural retrieval, freshness-oriented) — with
  // SerpAPI, Google CSE and the keyless DuckDuckGo scrape folded in behind.
  const [serp, google, exa, ddg] = await Promise.all([
    getSerpResults(query, rangeConfig?.tbs, signal)
      .then(normalizeSerpResults)
      .then(dedupeResults)
      .then(
        (results: SearchResult[]) => ({ results }),
        (error: unknown) => ({ error }),
      ),
    getWebSearchResults(query, 1, rangeConfig?.dateRestrict, signal)
      .then(normalizeGoogleResults)
      .then(dedupeResults)
      .then(
        (results: SearchResult[]) => ({ results }),
        (error: unknown) => ({ error }),
      ),
    // Exa works without a time filter; its retrieval is neural, not index-based
    getExaResults(query, signal)
      .then(normalizeExaResults)
      .then(dedupeResults)
      .then(
        (results: SearchResult[]) => ({ results }),
        (error: unknown) => ({ error }),
      ),
    getDuckDuckGoResults(query, signal)
      .then(normalizeDuckDuckGoResults)
      .then(dedupeResults)
      .then(
        (results: SearchResult[]) => ({ results }),
        (error: unknown) => ({ error }),
      ),
  ])

  if (signal?.aborted) {
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException('The operation was aborted.', 'AbortError')
  }

  const outcomes = [exa, serp, google, ddg] as const
  const counts = {
    exa: 'results' in exa ? exa.results.length : -1,
    serpapi: 'results' in serp ? serp.results.length : -1,
    googleCse: 'results' in google ? google.results.length : -1,
    duckduckgo: 'results' in ddg ? ddg.results.length : -1,
  }

  const failures = [exa, serp, google, ddg]
    .map((o) => ('error' in o ? o.error : undefined))
    .filter(Boolean)

  if (failures.length === 4) {
    logger.error('All search providers failed', new Error('serpapi + google + exa + duckduckgo all failed'), {
      query: query.slice(0, 80),
      exa: 'error' in exa ? (exa.error instanceof Error ? exa.error.message : String(exa.error)) : 'unknown',
      serpapi: 'error' in serp ? (serp.error instanceof Error ? serp.error.message : String(serp.error)) : 'unknown',
      googleCse: 'error' in google ? (google.error instanceof Error ? google.error.message : String(google.error)) : 'unknown',
      duckduckgo: 'error' in ddg ? (ddg.error instanceof Error ? ddg.error.message : String(ddg.error)) : 'unknown',
    })
    throw google && 'error' in google && google.error instanceof Error
      ? google.error
      : serp && 'error' in serp && serp.error instanceof Error
        ? serp.error
        : new Error('All search providers failed')
  }

  // Merge in Exa-first priority order, dedupe by link, cap the grounding set
  const merged: SearchResult[] = []
  const seen = new Set<string>()
  for (const outcome of outcomes) {
    if (!('results' in outcome)) continue
    for (const result of outcome.results) {
      if (seen.has(result.link)) continue
      seen.add(result.link)
      merged.push(result)
      if (merged.length >= MAX_GROUNDING_RESULTS) break
    }
    if (merged.length >= MAX_GROUNDING_RESULTS) break
  }

  if (failures.length > 0) {
    logger.warn('Some search providers failed; continuing with merged results', {
      query: query.slice(0, 80),
      counts,
    })
  }

  if (merged.length === 0) {
    logger.warn('All search providers returned empty result sets', {
      query: query.slice(0, 80),
      timeRange,
    })
    return { results: [], provider: 'merged' }
  }

  return { results: merged, provider: 'merged' }
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
        }, 'write')
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
