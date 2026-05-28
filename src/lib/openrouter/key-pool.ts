import { logger } from '../logger'

const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 45_000
const AUTH_FAILURE_COOLDOWN_MS = 10 * 60_000
const BILLING_FAILURE_COOLDOWN_MS = 15 * 60_000

type ApiKeyFailureReason = 'rate_limit' | 'auth' | 'billing'

interface ApiKeyHealthState {
  cooldownUntil: number
  lastFailureReason?: ApiKeyFailureReason
  consecutiveRateLimits: number
}

export interface ApiKeyPlanEntry {
  key: string
  label: string
  cooldownRemainingMs: number
}

const apiKeyHealth = new Map<string, ApiKeyHealthState>()
let nextKeyCursor = 0

function getOrCreateState(key: string): ApiKeyHealthState {
  const existing = apiKeyHealth.get(key)
  if (existing) {
    return existing
  }

  const created: ApiKeyHealthState = {
    cooldownUntil: 0,
    consecutiveRateLimits: 0,
  }
  apiKeyHealth.set(key, created)
  return created
}

function cleanupState(keys: string[], now = Date.now()): void {
  const activeKeys = new Set(keys)

  for (const key of apiKeyHealth.keys()) {
    if (!activeKeys.has(key)) {
      apiKeyHealth.delete(key)
      continue
    }

    const state = apiKeyHealth.get(key)
    if (state && state.cooldownUntil <= now && state.lastFailureReason !== 'auth' && state.lastFailureReason !== 'billing') {
      state.cooldownUntil = 0
      state.lastFailureReason = undefined
      // Keep consecutiveRateLimits so backoff escalation persists across cooldown cycles
    }
  }
}

export function parseRetryAfterHeader(value: string | null): number | null {
  if (!value) {
    return null
  }

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.round(seconds * 1000)
  }

  const retryAt = Date.parse(value)
  if (Number.isNaN(retryAt)) {
    return null
  }

  const diff = retryAt - Date.now()
  return diff > 0 ? diff : null
}

export function getApiKeyPlan(keys: string[]): ApiKeyPlanEntry[] {
  const now = Date.now()
  cleanupState(keys, now)

  if (keys.length === 0) {
    return []
  }

  const startIndex = nextKeyCursor % keys.length
  nextKeyCursor = (nextKeyCursor + 1) % keys.length

  const rotated = keys.map((_, index) => keys[(startIndex + index) % keys.length]!)

  const available: ApiKeyPlanEntry[] = []
  const coolingDown: ApiKeyPlanEntry[] = []

  for (const key of rotated) {
    const state = getOrCreateState(key)
    const cooldownRemainingMs = Math.max(0, state.cooldownUntil - now)
    const entry: ApiKeyPlanEntry = {
      key,
      label: `${available.length + coolingDown.length + 1}/${keys.length}`,
      cooldownRemainingMs,
    }

    if (cooldownRemainingMs > 0) {
      coolingDown.push(entry)
    } else {
      available.push(entry)
    }
  }

  coolingDown.sort((a, b) => a.cooldownRemainingMs - b.cooldownRemainingMs)

  return [...available, ...coolingDown].map((entry, index) => ({
    ...entry,
    label: `${index + 1}/${keys.length}`,
  }))
}

export function markApiKeySuccess(key: string): void {
  const state = getOrCreateState(key)
  state.cooldownUntil = 0
  state.lastFailureReason = undefined
  state.consecutiveRateLimits = 0
}

export function markApiKeyRateLimited(key: string, retryAfterMs?: number | null): void {
  const state = getOrCreateState(key)
  state.consecutiveRateLimits += 1
  state.lastFailureReason = 'rate_limit'

  const cooldownMs = retryAfterMs && retryAfterMs > 0
    ? retryAfterMs
    : DEFAULT_RATE_LIMIT_COOLDOWN_MS * Math.min(state.consecutiveRateLimits, 3)

  state.cooldownUntil = Math.max(state.cooldownUntil, Date.now() + cooldownMs)

  logger.warn('OpenRouter API key cooled down after rate limit', {
    cooldownMs,
    consecutiveRateLimits: state.consecutiveRateLimits,
  })
}

export function markApiKeyAuthFailed(key: string): void {
  const state = getOrCreateState(key)
  state.lastFailureReason = 'auth'
  state.cooldownUntil = Math.max(state.cooldownUntil, Date.now() + AUTH_FAILURE_COOLDOWN_MS)

  logger.warn('OpenRouter API key disabled after authentication failure', {
    cooldownMs: AUTH_FAILURE_COOLDOWN_MS,
  })
}

export function markApiKeyBillingFailed(key: string): void {
  const state = getOrCreateState(key)
  state.lastFailureReason = 'billing'
  state.cooldownUntil = Math.max(state.cooldownUntil, Date.now() + BILLING_FAILURE_COOLDOWN_MS)

  logger.warn('OpenRouter API key cooled down after billing failure', {
    cooldownMs: BILLING_FAILURE_COOLDOWN_MS,
  })
}

export function resetApiKeyPoolState(): void {
  apiKeyHealth.clear()
  nextKeyCursor = 0
}
