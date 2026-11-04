/**
 * Local synthesis — deterministic, provider-free answer built from retrieved
 * search context. Last-resort path when every LLM answer provider is down:
 * the user still gets a grounded, citation-linked result.
 */

import type { SearchContextItem } from './search-context'

export function synthesizeFromContext(
  query: string,
  context: SearchContextItem[]
): string | null {
  if (context.length === 0) return null

  const lines: string[] = []
  lines.push(
    `_All AI answer providers are currently unavailable, so here is a direct synthesis of the ${context.length} source${context.length === 1 ? '' : 's'} retrieved for "${query}"._`
  )
  lines.push('')

  for (let i = 0; i < context.length; i++) {
    const item = context[i]
    const snippet = (item.snippet || '').replace(/\s+/g, ' ').trim()
    if (!snippet) continue
    lines.push(`**[${i + 1}] ${item.title}** — ${snippet} [${i + 1}]`)
    lines.push('')
  }

  const sourceList = context
    .map((item, i) => `${i + 1}. [${item.title}](${item.link})`)
    .join('\n')

  lines.push('**Sources**')
  lines.push(sourceList)

  return lines.join('\n').trim()
}
