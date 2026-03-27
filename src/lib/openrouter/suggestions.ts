/**
 * OpenRouter Search Suggestions
 * Generates AI-powered search suggestions with fallback
 */

import type { ChatMessage, SuggestionsResult } from './types'
import { AITask } from './types'
import { suggestionsResponseSchema } from '../validation'
import { callOpenRouter, extractJsonArray } from './client'
import { MAX_SUGGESTIONS } from '../constants'

// ── Fallback Generator ───────────────────────────────────────────────────────

function generateFallbackSuggestions(query: string): string[] {
  return [
    `${query} technical specification`,
    `${query} comparative analysis`,
    `latest developments in ${query}`,
    `${query} implementation guide`,
    `common pitfalls of ${query}`,
  ]
}

// ── Search Suggestions ───────────────────────────────────────────────────────

export async function getSearchSuggestions(query: string): Promise<SuggestionsResult> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        `You are SeekEngine Intelligence Optimizer. Output EXACTLY ${MAX_SUGGESTIONS} high-value search paths as a pure JSON array of strings.`,
    },
    {
      role: 'user',
      content: `Generate intelligence paths for: "${query}"`,
    },
  ]

  const result = await callOpenRouter(messages, AITask.SUGGESTIONS)

  if (!result) {
    return {
      suggestions: generateFallbackSuggestions(query),
      model: 'fallback',
      modelHuman: 'Fallback',
      latencyMs: 0,
      attempts: 0,
    }
  }

  try {
    const json = extractJsonArray(result.content)
    if (!json) throw new Error('No JSON array found')

    const parsed = JSON.parse(json)
    const validated = suggestionsResponseSchema.safeParse({ suggestions: parsed })

    return {
      suggestions: validated.success
        ? validated.data.suggestions.slice(0, MAX_SUGGESTIONS)
        : generateFallbackSuggestions(query),
      model: result.model,
      modelHuman: result.modelHuman,
      latencyMs: result.latencyMs,
      attempts: result.attempts,
    }
  } catch {
    return {
      suggestions: generateFallbackSuggestions(query),
      model: result.model,
      modelHuman: result.modelHuman,
      latencyMs: result.latencyMs,
      attempts: result.attempts,
    }
  }
}
