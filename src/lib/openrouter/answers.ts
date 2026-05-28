/**
 * OpenRouter Answer & Code Generation
 * High-level AI answer and code generation functions
 */

import type { ChatMessage, AnswerResult, CodeResult } from './types'
import { AITask } from './types'
import { answerResponseSchema } from '../validation'
import { callOpenRouter } from './client'

// ── Answer Generation ────────────────────────────────────────────────────────

export async function generateAIAnswer(
  query: string,
  context?: { title: string; snippet: string }[]
): Promise<AnswerResult> {
  const contextText =
    context
      ?.map((r, i) => `[${i + 1}] "${r.title}": ${r.snippet}`)
      .join('\n') || ''

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are SeekEngine AI. Concise markdown. ${
        contextText ? `Source base:\n${contextText}` : ''
      } Cite sources as [n].`,
    },
    {
      role: 'user',
      content: query,
    },
  ]

  const result = await callOpenRouter(messages, AITask.ANSWER)

  if (!result) {
    return {
      answer: 'AI summary unavailable.',
      model: 'none',
      modelHuman: 'Unavailable',
      latencyMs: 0,
      tier: 'balanced',
      attempts: 0,
    }
  }

  const validated = answerResponseSchema.safeParse({ answer: result.content })

  return {
    answer: validated.success ? validated.data.answer : 'AI summary unavailable.',
    model: result.model,
    modelHuman: result.modelHuman,
    latencyMs: result.latencyMs,
    tier: result.tier,
    attempts: result.attempts,
  }
}

// ── Code Generation ──────────────────────────────────────────────────────────

export async function generateCode(
  prompt: string,
  language?: string
): Promise<CodeResult> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a precise code generator. Output clean, working ${language || 'code'} only. No explanations unless asked. Use markdown code blocks.`,
    },
    {
      role: 'user',
      content: prompt,
    },
  ]

  const result = await callOpenRouter(messages, AITask.CODE)

  if (!result) {
    return {
      code: '// Code generation unavailable',
      model: 'none',
      modelHuman: 'Unavailable',
      latencyMs: 0,
      attempts: 0,
    }
  }

  return {
    code: result.content,
    model: result.model,
    modelHuman: result.modelHuman,
    latencyMs: result.latencyMs,
    attempts: result.attempts,
  }
}
