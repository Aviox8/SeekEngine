/**
 * OpenRouter Core API Client
 * Non-streaming API calls and utility functions
 */

import { ENV } from '../env'
import type { ChatMessage, AIResult, AITask, ModelTier } from './types'
import { OPENROUTER_BASE_URL, TASK_POLICIES, MAX_MODEL_FAILURES } from './config'
import { humanizeModel, classifyModel, modelFailures, logTelemetry, getModelsForTask } from './models'

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
  const apiKey = ENV.OPENROUTER_API_KEY
  if (!apiKey) {
    console.warn('⚠️ OPENROUTER_API_KEY missing - check .env.local')
    return null
  }
  console.log('🔑 API Key validated')

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

  const startTime = Date.now()
  let attempts = 0

  for (const model of models) {
    attempts++

    if (Date.now() - startTime > policy.globalTimeout) {
      console.warn(`⏱️ Global timeout (${policy.globalTimeout}ms) for task: ${task}`)
      return null
    }

    console.log(`🤖 Attempt ${attempts}: Trying ${humanizeModel(model)} (${model}) [Tier: ${classifyModel(model)}]`)

    const modelStartTime = Date.now()
    const tier: ModelTier = classifyModel(model)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), policy.maxLatency)

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

      // 429 (Rate Limit) is NOT a model failure - it's API quota exhaustion, skip without incrementing
      if (response.status === 429) {
        console.warn(`⚠️ Rate limited (429) for ${model} - skipping to next model`)
        logTelemetry({ task, model, tier, latency, success: false, error: 'Rate Limited' })
        await new Promise(r => setTimeout(r, 300))
        continue
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
        logTelemetry({ task, model, tier, latency, success: true, tokens })
        console.log(`📝 [GENERATED] ${model} (${tier}): "${content.slice(0, 100).replace(/\n/g, ' ')}..."`)

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

  console.error('❌ All models failed for this request.')
  return null
}
