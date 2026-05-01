import { beforeEach, describe, expect, it } from 'vitest'
import {
  getApiKeyPlan,
  markApiKeyRateLimited,
  parseRetryAfterHeader,
  resetApiKeyPoolState,
} from '@/lib/openrouter/key-pool'

describe('OpenRouter key pool', () => {
  beforeEach(() => {
    resetApiKeyPoolState()
  })

  it('rotates the starting key between requests', () => {
    expect(getApiKeyPlan(['k1', 'k2', 'k3']).map((entry) => entry.key)).toEqual(['k1', 'k2', 'k3'])
    expect(getApiKeyPlan(['k1', 'k2', 'k3']).map((entry) => entry.key)).toEqual(['k2', 'k3', 'k1'])
    expect(getApiKeyPlan(['k1', 'k2', 'k3']).map((entry) => entry.key)).toEqual(['k3', 'k1', 'k2'])
  })

  it('deprioritizes cooled keys when other keys are available', () => {
    markApiKeyRateLimited('k1', 60_000)

    const plan = getApiKeyPlan(['k1', 'k2', 'k3'])

    expect(plan.map((entry) => entry.key)).toEqual(['k2', 'k3', 'k1'])
    expect(plan[2]?.cooldownRemainingMs).toBeGreaterThan(0)
  })

  it('parses retry-after seconds into milliseconds', () => {
    expect(parseRetryAfterHeader('7')).toBe(7_000)
  })
})
