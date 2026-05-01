/**
 * OpenRouter Core API Client
 * Non-streaming API calls and utility functions
 */

import { getOpenRouterApiKeys } from '../env'
import { logger } from '../logger'
import type { ChatMessage, AIResult, AITask, ModelTier } from './types'
import { OPENROUTER_BASE_URL, TASK_POLICIES, MAX_MODEL_FAILURES } from './config'
import { humanizeModel, classifyModel, modelFailures, logTelemetry, getModelsForTask } from './models'
import {
  getApiKeyPlan,
  markApiKeyAuthFailed,
  markApiKeyBillingFailed,
  markApiKeyRateLimited,
  markApiKeySuccess,
  parseRetryAfterHeader,
} from './key-pool'

// ── Hardened JSON Extraction ─────────────────────────────────────────────────

export function extractJsonArray(text: string): string | null {
  const match = text.match(/\[\s*"[\s\S]*?"\s*\]/)
  return match ? match[0] : null
}

// ── Core OpenRouter Caller ───────────────────────────────────────────────────

export async function callOpenRouter(
  messages: ChatMessage[],
  task: AITask
): Promise<AIResult | null> {
  const apiKeys = getOpenRouterApiKeys()
  if (apiKeys.length === 0) {
    logger.warn('OpenRouter key pool is empty - set OPENROUTER_API_KEY or OPENROUTER_API_KEYS')
    return null
  }
  logger.debug('OpenRouter API keys validated', { keyCount: apiKeys.length })

  const policy = TASK_POLICIES[task]
  const allModels = await getModelsForTask(task)
  
  let models = allModels.filter(m => {
    const failInfo = modelFailures.get(m)
    return !failInfo || failInfo.failures < MAX_MODEL_FAILURES
  })
  
  if (models.length === 0) {
    console.warn(`⚠️ All models failed for ${task}. Resetting failures.`)
    modelFailures.clear()
    models = allModels
  }

  let attempts = 0

  const keyPlan = getApiKeyPlan(apiKeys)

  keyLoop:
  for (let keyIndex = 0; keyIndex < keyPlan.length; keyIndex++) {
    const { key: apiKey, label: keyLabel, cooldownRemainingMs } = keyPlan[keyIndex]!
    const keyStartTime = Date.now()

    logger.info('Using OpenRouter key', {
      keyLabel,
      cooledDown: cooldownRemainingMs > 0,
      cooldownRemainingMs,
    })

    for (const model of models) {
      attempts++

      if (Date.now() - keyStartTime > policy.globalTimeout) {
        logger.warn('OpenRouter key exceeded task timeout budget', {
          task,
          keyLabel,
          timeoutMs: policy.globalTimeout,
        })
        break
      }

      logger.debug('Attempting model via OpenRouter key', {
        attempts,
        model,
        modelHuman: humanizeModel(model),
        tier: classifyModel(model),
        keyLabel,
      })

      const modelStartTime = Date.now()
      const tier: ModelTier = classifyModel(model)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort('MODEL_TIMEOUT'), policy.maxLatency)

      try {
        const response = await fetch(
          `${OPENROUTER_BASE_URL}/chat/completions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://github.com/archduke1337/seekengine',
              'X-Title': 'SeekEngine',
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: policy.temperature,
              max_tokens: policy.maxTokens,
              top_p: 1,
            }),
            signal: controller.signal,
          }
        )

        clearTimeout(timeoutId)
        const latency = Date.now() - modelStartTime

        // 401/403 indicate key-level auth issue - switch to next key.
        if ([401, 403].includes(response.status)) {
          markApiKeyAuthFailed(apiKey)
          logTelemetry({ task, model, tier, latency, success: false, error: `HTTP ${response.status} Auth` })
          continue keyLoop
        }

        // 402 indicates account-level billing issue. Try next key if available.
        if (response.status === 402) {
          markApiKeyBillingFailed(apiKey)
          logTelemetry({ task, model, tier, latency, success: false, error: 'HTTP 402 Billing Required' })
          continue keyLoop
        }

        // 429 is usually a key/account throttle. Cool down the key and swap immediately.
        if (response.status === 429) {
          markApiKeyRateLimited(apiKey, parseRetryAfterHeader(response.headers.get('retry-after')))
          logTelemetry({ task, model, tier, latency, success: false, error: 'Rate Limited' })
          continue keyLoop
        }

        // 500-503 are transient server errors - mark as model failure
        if ([500, 502, 503].includes(response.status)) {
          console.warn(`⚠️ Transient server error ${response.status} for ${model}`)
          const failInfo = modelFailures.get(model)
          modelFailures.set(model, {
            failures: (failInfo?.failures || 0) + 1,
            lastFailedAt: Date.now()
          })
          logTelemetry({ task, model, tier, latency, success: false, error: `HTTP ${response.status}` })
          await new Promise(r => setTimeout(r, 300))
          continue
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          console.error(`❌ Model ${model} failed with ${response.status}: ${errorText}`)
          const failInfo = modelFailures.get(model)
          modelFailures.set(model, {
            failures: (failInfo?.failures || 0) + 1,
            lastFailedAt: Date.now()
          })
          logTelemetry({ task, model, tier, latency, success: false, error: `HTTP ${response.status}` })
          continue
        }

        const data = await response.json()
        const content = data?.choices?.[0]?.message?.content
        const tokens = data?.usage?.total_tokens

        if (content) {
          markApiKeySuccess(apiKey)
          logTelemetry({ task, model, tier, latency, success: true, tokens })
          logger.info('Generated OpenRouter response', {
            model,
            tier,
            attempts,
            keyLabel,
          })

          return {
            content,
            model,
            modelHuman: humanizeModel(model),
            latencyMs: latency,
            tier,
            attempts,
          }
        }

        logTelemetry({ task, model, tier, latency, success: false, error: 'Empty response' })
      } catch (err: unknown) {
        clearTimeout(timeoutId)
        const error = err as Error
        const latency = Date.now() - modelStartTime

        if (error.name === 'AbortError') {
          logTelemetry({ task, model, tier, latency, success: false, error: 'Timeout' })
        } else {
          const failInfo = modelFailures.get(model)
          modelFailures.set(model, {
            failures: (failInfo?.failures || 0) + 1,
            lastFailedAt: Date.now()
          })
          logTelemetry({ task, model, tier, latency, success: false, error: error.message })
        }
      }
    }

    if (keyIndex < apiKeys.length - 1) {
      logger.warn('Falling back to next OpenRouter key after no success', { keyLabel })
    }
  }

  logger.error('All models failed for this request across all configured OpenRouter keys.')
  return null
}
