/**
 * DuckDuckGo HTML Scraper — zero-key last-resort search provider.
 *
 * Scrapes the static lite HTML endpoint. Not an official API; result markup
 * changes occasionally — treat as best-effort and never as the primary path.
 */

import { fetchWithTimeout } from './http-utils'
import { EXTERNAL_API_TIMEOUT_MS } from './constants'
import { Errors, SeekEngineError } from './errors'
import { logger } from './logger'

export interface DuckDuckGoResult {
  title: string
  link: string
  snippet: string
  source: string
}

const DDG_HTML_URL = 'https://html.duckduckgo.com/html/'

function decodeDdgRedirect(href: string): string | null {
  try {
    const url = new URL(href, 'https://duckduckgo.com')
    const uddg = url.searchParams.get('uddg')
    if (uddg) return decodeURIComponent(uddg)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString()
    return null
  } catch {
    return null
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Fetch results from DuckDuckGo's HTML endpoint.
 * No API key required; used only when SerpAPI, Google CSE and Exa all fail.
 */
export async function getDuckDuckGoResults(
  query: string,
  signal?: AbortSignal
): Promise<DuckDuckGoResult[]> {
  try {
    const url = new URL(DDG_HTML_URL)
    url.searchParams.set('q', query)

    const response = await fetchWithTimeout(
      url,
      EXTERNAL_API_TIMEOUT_MS,
      {
        signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SeekEngineBot/1.0; +https://seekengine.vercel.app)',
          Accept: 'text/html,application/xhtml+xml',
        },
      }
    )

    if (!response.ok) {
      logger.warn('DuckDuckGo HTML endpoint returned non-OK status', { status: response.status })
      throw Errors.externalApiFailed('DuckDuckGo', response.status)
    }

    const html = await response.text()
    const results: DuckDuckGoResult[] = []
    const seen = new Set<string>()

    const linkRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
    const snippetRegex = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi

    const snippets: string[] = []
    let snippetMatch: RegExpExecArray | null
    while ((snippetMatch = snippetRegex.exec(html)) !== null) {
      snippets.push(stripTags(snippetMatch[1] ?? ''))
    }

    let index = 0
    let match: RegExpExecArray | null
    while ((match = linkRegex.exec(html)) !== null && results.length < 10) {
      const href = match[1] ?? ''
      const link = decodeDdgRedirect(href)
      const title = stripTags(match[2] ?? '')
      if (!link || !title || seen.has(link)) {
        index += 1
        continue
      }
      seen.add(link)
      results.push({
        title,
        link,
        snippet: snippets[index] ?? '',
        source: 'duckduckgo',
      })
      index += 1
    }

    if (results.length === 0) {
      logger.warn('DuckDuckGo scrape returned no parseable results', { query: query.slice(0, 80) })
    }

    return results
  } catch (error) {
    if (signal?.aborted) throw error
    if (error instanceof SeekEngineError) throw error
    if ((error as Error).name === 'AbortError') {
      throw Errors.timeout('DuckDuckGo', EXTERNAL_API_TIMEOUT_MS)
    }

    logger.error('DuckDuckGo scrape failed', error instanceof Error ? error : String(error))
    throw Errors.externalApiFailed('DuckDuckGo')
  }
}
