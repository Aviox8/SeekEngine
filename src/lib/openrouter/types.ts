/**
 * OpenRouter AI Types
 * Shared type definitions for the AI integration layer
 */

export type ChatRole = 'system' | 'user' | 'assistant'
export type ChatMessage = { role: ChatRole; content: string }

export type OpenRouterModel = {
  id: string
  pricing?: {
    prompt?: number
    completion?: number
  }
  architecture?: {
    output_modalities?: string[]
  }
  context_length?: number
}

export type ModelTier = 'fast' | 'balanced' | 'heavy' | 'code'

/** Observable AI result - exposes which model answered */
export type AIResult = {
  content: string
  model: string
  modelHuman: string
  latencyMs: number
  tier: ModelTier
  attempts: number
}

export enum AITask {
  SUGGESTIONS = 'suggestions',
  ANSWER = 'answer',
  CODE = 'code',
}

export interface TaskPolicy {
  temperature: number
  maxTokens: number
  preferredTiers: ModelTier[]
  maxLatency: number
  globalTimeout: number
}

export interface TelemetryEvent {
  task: AITask
  model: string
  tier: ModelTier
  latency: number
  success: boolean
  tokens?: number
  error?: string
}

export interface StreamEvent {
  type: 'token' | 'thinking' | 'done' | 'error' | 'model_selected' | 'sources' | 'cache_hit'
  content?: string
  model?: string
  modelHuman?: string
  tier?: ModelTier
  latencyMs?: number
  attempts?: number
  error?: string
  cached?: boolean
  cachedAt?: number
  sources?: { title: string; url: string; favicon?: string }[]
}

export interface SuggestionsResult {
  suggestions: string[]
  model: string
  modelHuman: string
  latencyMs: number
  attempts: number
}

export interface AnswerResult {
  answer: string
  model: string
  modelHuman: string
  latencyMs: number
  tier: ModelTier
  attempts: number
}

export interface CodeResult {
  code: string
  model: string
  modelHuman: string
  latencyMs: number
  attempts: number
}
