/**
 * OpenRouter AI Integration — Module Barrel
 * Re-exports all public APIs for backward compatibility
 */

// Types
export { AITask } from './types'
export type {
  ChatRole,
  ChatMessage,
  ModelTier,
  AIResult,
  StreamEvent,
  SuggestionsResult,
  AnswerResult,
  CodeResult,
} from './types'

// Streaming
export { streamOpenRouter, createStreamingAnswerResponse } from './streaming'

// Suggestions
export { getSearchSuggestions } from './suggestions'

// Models (for advanced usage)
export { humanizeModel, classifyModel } from './models'
