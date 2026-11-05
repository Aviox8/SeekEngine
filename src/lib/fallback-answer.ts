/**
 * Local synthesis — deterministic, provider-free answer built from retrieved
 * search context. Last-resort path when every LLM answer provider is down:
 * the user still gets a grounded, citation-linked result.
 *
 * Exact-match relevance: source items whose title/snippet/link directly
 * match the query are surfaced first so the answer reflects what the user
 * actually asked for, not just whatever the fan-out returned first.
 */

import type { SearchContextItem } from './search-context'

function scoreRelevance(query: string, item: SearchContextItem): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0

  const title = (item.title || '').toLowerCase()
  const snippet = (item.snippet || '').toLowerCase()
  const link = (item.link || '').toLowerCase()

  if (title === q || title.includes(q)) return 100
  if (snippet.includes(q)) return 60
  if (link.includes(q)) return 30

  // partial word overlap bonus
  const words = q.split(/\s+/).filter(Boolean)
  if (words.length > 0) {
    let hits = 0
    for (const w of words) {
      if (title.includes(w) || snippet.includes(w) || link.includes(w)) hits++
    }
    return (hits / words.length) * 40
  }

  return 0
}

export function synthesizeFromContext(
  query: string,
  context: SearchContextItem[]
): string | null {
  if (context.length === 0) return null

  // Sort by exact-match relevance descending; stable for equal scores.
  const ranked = [...context].sort((a, b) => scoreRelevance(query, b) - scoreRelevance(query, a))

  const lines: string[] = []
  const exactCount = ranked.filter((item) => scoreRelevance(query, item) >= 60).length

  lines.push(
    `_All AI answer providers are currently unavailable, so here is a direct synthesis of the ${ranked.length} source${ranked.length === 1 ? '' : 's'} retrieved for "${query}".${
      exactCount > 0 ? ` ${exactCount} source${exactCount === 1 ? '' : 's'} directly match your query.` : ''
    }_`
  )
  lines.push('')

  for (let i = 0; i < ranked.length; i++) {
    const item = ranked[i]
    const snippet = (item.snippet || '').replace(/\s+/g, ' ').trim()
    if (!snippet) continue
    lines.push(`**[${i + 1}] ${item.title}** — ${snippet} [${i + 1}]`)
    lines.push('')
  }

  const sourceList = ranked
    .map((item, i) => `${i + 1}. [${item.title}](${item.link})`)
    .join('\n')

  lines.push('**Sources**')
  lines.push(sourceList)

  return lines.join('\n').trim()
}
