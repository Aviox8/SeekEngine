/**
 * Global Constants
 * Centralized magic numbers and configuration constants.
 * Only values consumed by at least one module live here — anything else
 * is documented next to the logic that actually uses it.
 */

// ── Timing Constants ─────────────────────────────────────────────────────────
export const DEBOUNCE_MS = 300 // Search suggestions debounce
export const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
export const MODEL_CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
export const MODEL_FETCH_TIMEOUT_MS = 5_000 // Fetching model list from OpenRouter
export const EXTERNAL_API_TIMEOUT_MS = 10_000 // External search APIs

// ── Model Racing ─────────────────────────────────────────────────────────────
export const MAX_MODEL_FAILURES_THRESHOLD = 3
export const MAX_CONCURRENT_MODELS = 5 // Absolute maximum models raced per batch
export const MODEL_FAILURE_RECOVERY_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
export const SYSTEMIC_FAILURE_THRESHOLD_MS = 30_000 // 30 seconds

// Time to first token budgets per model tier
export const TTFT_FAST_MS = 2_000 // fast-tier models respond quickly or lose the race
export const TTFT_SLOW_MS = 5_000 // all other tiers

// Validate configuration at module load
if (MAX_CONCURRENT_MODELS <= 0) {
  throw new Error('MAX_CONCURRENT_MODELS must be > 0 to enable model racing')
}
if (MAX_MODEL_FAILURES_THRESHOLD < 1) {
  throw new Error('MAX_MODEL_FAILURES_THRESHOLD must be >= 1')
}

// ── Query Length & Validation ───────────────────────────────────────────────
export const QUERY_MIN_LENGTH = 1
export const QUERY_MAX_LENGTH = 500

// ── AI Token Budgets ────────────────────────────────────────────────────────
export const MAX_ANSWER_TOKENS = 800
export const MAX_SUGGESTION_TOKENS = 200
export const MAX_CODE_TOKENS = 1_200

// ── Rate Limiting ────────────────────────────────────────────────────────────
export const RATE_LIMIT_MAX_ENTRIES = 10_000 // Hard cap on tracked IPs

// ── Semantic Cache ──────────────────────────────────────────────────────────
export const SEMANTIC_CACHE_MAX_ENTRIES = 500

// ── Suggestions ─────────────────────────────────────────────────────────────
export const MAX_SUGGESTIONS = 5

// ── Time Range Filters (Single Source of Truth) ──────────────────────────────
// Maps short codes (h/d/w/m/y) to API-specific parameters
// Used by Google Custom Search (dateRestrict) and SerpAPI (tbs)
export const TIME_RANGES = {
  h: { label: 'Past Hour', tbs: 'qdr:h', dateRestrict: 'd1' },
  d: { label: 'Past Day', tbs: 'qdr:d', dateRestrict: 'd1' },
  w: { label: 'Past Week', tbs: 'qdr:w', dateRestrict: 'w1' },
  m: { label: 'Past Month', tbs: 'qdr:m', dateRestrict: 'm1' },
  y: { label: 'Past Year', tbs: 'qdr:y', dateRestrict: 'y1' },
} as const

export type TimeRangeCode = keyof typeof TIME_RANGES

// ── Patterns & Formats ──────────────────────────────────────────────────────
export const UNSAFE_CHARS_REGEX = /[<>\"';]/g
export const NEWLINE_REGEX = /[\n\r]/g
export const WHITESPACE_COLLAPSE_REGEX = /\s+/g
