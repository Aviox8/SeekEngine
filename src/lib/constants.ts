/**
 * Global Constants
 * Centralized magic numbers and configuration constants
 */

// ── Timing Constants ─────────────────────────────────────────────────────────
export const DEBOUNCE_MS = 300 // Search suggestions debounce
export const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
export const MODEL_CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
export const MODEL_RACING_TIMEOUT_MS = 200 // Delay before starting slower models
export const TTFT_THRESHOLD_MS = 5000 // Time to first token threshold

// ── Rate Limiting ────────────────────────────────────────────────────────────
export const RATE_LIMITS = {
  SEARCH_PER_MIN: 30,
  SUGGESTIONS_PER_MIN: 60,
  ANSWERS_PER_MIN: 20,
  STREAMING_PER_MIN: 20,
} as const

export const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60 * 1000 // 60 seconds
export const RATE_LIMIT_MAX_ENTRIES = 10_000 // Hard cap on tracked IPs

// ── Model Configuration ──────────────────────────────────────────────────────
export const MAX_MODEL_FAILURES_THRESHOLD = 3
export const MODEL_RACING_CONCURRENCY = 3 // Start N models simultaneously
export const MAX_CONCURRENT_MODELS = 5 // Absolute maximum

// ── Query Length & Validation ───────────────────────────────────────────────
export const QUERY_MIN_LENGTH = 2
export const QUERY_MAX_LENGTH = 500
export const SUGGESTION_MIN_LENGTH = 1

// ── API Response ─────────────────────────────────────────────────────────────
export const DEFAULT_RESULTS_LIMIT = 8 // Search results per query
export const MAX_SUGGESTIONS = 5
export const MAX_ANSWER_TOKENS = 800
export const MAX_SUGGESTION_TOKENS = 200

// ── Semantic Cache ──────────────────────────────────────────────────────────
export const SEMANTIC_CACHE_MAX_ENTRIES = 500
export const CACHE_CLEANUP_INTERVAL_MS = 60 * 1000 // Periodic cleanup

// ── API Timeout Thresholds ──────────────────────────────────────────────────
export const OPENROUTER_REQUEST_TIMEOUT_MS = 30_000 // 30 seconds
export const EXTERNAL_API_TIMEOUT_MS = 10_000 // External search APIs
export const MODEL_FETCH_TIMEOUT_MS = 5_000 // Fetching model list

// ── Streaming ────────────────────────────────────────────────────────────────
export const SSE_MAX_CHUNK_SIZE = 1024 * 4 // 4KB chunks
export const SSE_PING_INTERVAL_MS = 30_000 // Keep-alive ping

// ── Environment ─────────────────────────────────────────────────────────────
export const NODE_ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

// ── Patterns & Formats ──────────────────────────────────────────────────────
export const UNSAFE_CHARS_REGEX = /[<>\"'];/g
export const NEWLINE_REGEX = /[\n\r]/g
export const WHITESPACE_COLLAPSE_REGEX = /\s+/g
