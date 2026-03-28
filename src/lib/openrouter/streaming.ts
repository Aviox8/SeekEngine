/**
 * OpenRouter Streaming AI Engine
 * 
 * Features:
 * - SSE-compatible streaming via ndjson format
 * - Model racing: Connect to N models, use first successful token
 * - Tier-aware timeouts: Fast models get 2s TTFT, others get 5s
 * - Proper connection cleanup: Losing connections aborted immediately
 * - Graceful error handling: Failures tracked, retries with next model
 * - Performance telemetry: Logs per-model latency and success rates
 */

import { ENV } from '../env'
import { logger } from '../logger'
import type { ChatMessage, AITask, ModelTier, StreamEvent } from './types'
import { AITask as AITaskEnum } from './types'
import { OPENROUTER_BASE_URL, TASK_POLICIES, MAX_MODEL_FAILURES, BASE_SYSTEM_PROMPT } from './config'
import { humanizeModel, classifyModel, modelFailures, logTelemetry, getModelsForTask } from './models'
import { MAX_CONCURRENT_MODELS, SYSTEMIC_FAILURE_THRESHOLD_MS } from '../constants'

// ── Streaming AI Caller (SSE-Compatible) ─────────────────────────────────────
/**
 * Main streaming generator function
 * Implements model racing with immediate cleanup of losing connections
 * 
 * Algorithm:
 * 1. Fetch available models for task (sorted by health)
 * 2. Race models in batches of 2
 * 3. First model to produce token wins
 * 4. Immediately abort all other models
 * 5. Stream remaining tokens from winner
 * 6. If all models fail, try next batch
 * 
 * @param messages - Chat messages for context
 * @param task - Task type (ANSWER, SUGGESTIONS, CODE)
 * @yields StreamEvent (thinking, model_selected, token, done, error)
 */
export async function* streamOpenRouter(
  messages: ChatMessage[],
  task: AITask = AITaskEnum.ANSWER
): AsyncGenerator<StreamEvent> {
  const apiKey = ENV.OPENROUTER_API_KEY
  if (!apiKey) {
    logger.error('OPENROUTER_API_KEY is missing')
    yield { type: 'error', error: 'OPENROUTER_API_KEY missing' }
    return
  }

  const policy = TASK_POLICIES[task]
  const allModels = await getModelsForTask(task)
  
  // Filter out models that have failed too many times
  let models = allModels.filter(m => {
    const failInfo = modelFailures.get(m)
    return !failInfo || failInfo.failures < MAX_MODEL_FAILURES
  })
  
  // CRITICAL FIX: Implement circuit breaker with proper timestamp tracking
  // Previously: Math.max(...map(() => Date.now())) always returned Date.now(), breaking systemic failure detection
  // Now: Correctly extract lastFailedAt from failure info to detect recent systemic issues
  if (models.length === 0) {
    logger.warn('All models have hit failure threshold. Checking for systemic failure...')
    
    // Find the most recent failure timestamp across all models
    let mostRecentFailureTime = 0
    for (const failInfo of modelFailures.values()) {
      if (failInfo.lastFailedAt > mostRecentFailureTime) {
        mostRecentFailureTime = failInfo.lastFailedAt
      }
    }
    
    // If ALL models failed within the last 30 seconds, we have a systemic issue (API down)
    // Don't keep retrying - fail fast to avoid quota waste and rate limiting
    const timeSinceMostRecentFailure = Date.now() - mostRecentFailureTime
    if (timeSinceMostRecentFailure < SYSTEMIC_FAILURE_THRESHOLD_MS && modelFailures.size > 0) {
      logger.error(`Systemic API failure detected - all ${modelFailures.size} models failed ${timeSinceMostRecentFailure}ms ago`)
      yield { type: 'error', error: 'All AI models currently unavailable. API appears to be down.' }
      return
    }
    
    // Try recovery after 30 seconds of failure-free time from oldest failed model
    logger.warn(`Attempting recovery after ${timeSinceMostRecentFailure}ms - clearing failure history`)
    modelFailures.clear()
    models = allModels
  }
  
  if (models.length === 0) {
    logger.error(`No models available for racing (all: ${allModels.length})`)
    yield { type: 'error', error: 'No models available for this task' }
    return
  }

  const startTime = Date.now()
  let attempts = 0

  yield { type: 'thinking', content: 'Connecting to AI...' }

  // ── Model Connection Handler ──────────────────────────────────────────────────
  const connectToModel = async (model: string, externalController?: AbortController): Promise<{
    model: string
    reader: ReadableStreamDefaultReader<Uint8Array>
    decoder: TextDecoder
    remainingBuffer: string
    firstToken: string | null
    latency: number
    controller: AbortController
    tier: ModelTier
  }> => {
    const tier = classifyModel(model)
    const controller = externalController || new AbortController()
    const modelStartTime = Date.now()
    const remainingGlobalBudget = Math.max(1000, policy.globalTimeout - (Date.now() - startTime) - 250)
    const connectTimeoutMs = Math.max(1200, Math.min(policy.maxLatency, remainingGlobalBudget))
    const connectTimeoutId = setTimeout(() => controller.abort('MODEL_TIMEOUT'), connectTimeoutMs)
    let ttftTimeoutId: ReturnType<typeof setTimeout> | undefined

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
            stream: true,
          }),
          signal: controller.signal,
        }
      )

      if (!response.ok || !response.body) {
        // 429 (Rate Limit) is NOT a model failure - it's API quota exhaustion
        if (response.status === 429) {
          logger.warn(`Rate limited (429) for ${model} - moving to next model`)
          throw new Error('RATE_LIMITED')
        }

        // 401/403 indicate invalid credentials and should fail fast.
        if (response.status === 401 || response.status === 403) {
          logger.error(`Authentication failure from OpenRouter (HTTP ${response.status})`)
          throw new Error(`AUTH_ERROR_${response.status}`)
        }

        // 402 indicates account-level credit/billing issue.
        if (response.status === 402) {
          logger.error('OpenRouter account requires credits or billing setup (HTTP 402)')
          throw new Error('BILLING_REQUIRED')
        }

        // Let catch block handle failure accounting to avoid double counting.
        logger.warn(`Model connection failed: ${model} (HTTP ${response.status || 'UNKNOWN'})`)
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      
      // Tier-aware TTFT (Time To First Token) timeouts
      const ttftLimit = tier === 'fast' ? 2000 : 5000
      const ttftTimeout = new Promise<never>((_, reject) => {
        ttftTimeoutId = setTimeout(
          () => reject(new Error('TTFT_TIMEOUT')),
          Math.min(ttftLimit, connectTimeoutMs)
        )
      })

      const readFirstChunk = async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          // CRITICAL FIX: Preserve stream: true to handle UTF-8 boundaries correctly
          // decode(value, { stream: true }) keeps incomplete UTF-8 sequences in TextDecoder state
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          // Keep incomplete UTF-8 sequences in buffer by retaining partial line
          buffer = lines.pop() || ''

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const trimmed = line.trim()
            if (!trimmed || trimmed === 'data: [DONE]') continue
            if (!trimmed.startsWith('data: ')) continue

            try {
              if (!trimmed.includes('"content":')) continue

              const json = JSON.parse(trimmed.slice(6))
              const delta = json.choices?.[0]?.delta?.content
              if (delta) {
                const remainingLines = lines.slice(i + 1)
                if (remainingLines.length > 0) {
                  buffer = remainingLines.join('\n') + (buffer ? '\n' + buffer : '')
                }
                return delta
              }
            } catch { }
          }
        }
        throw new Error('No token found')
      }

      const firstToken = await Promise.race([readFirstChunk(), ttftTimeout])
      if (ttftTimeoutId) clearTimeout(ttftTimeoutId)
      clearTimeout(connectTimeoutId)

      return {
        model,
        reader,
        decoder,
        remainingBuffer: buffer,
        firstToken,
        latency: Date.now() - modelStartTime,
        controller,
        tier
      }

    } catch (err) {
      if (ttftTimeoutId) clearTimeout(ttftTimeoutId)
      clearTimeout(connectTimeoutId)

      const rawErrorMsg = (err as Error).message
      const abortReason = controller.signal.aborted
        ? String((controller.signal as AbortSignal & { reason?: unknown }).reason ?? '')
        : ''
      const isExpectedAbort =
        abortReason === 'RACE_LOST' ||
        abortReason === 'BATCH_ABORT' ||
        abortReason === 'GLOBAL_TIMEOUT_ABORT' ||
        abortReason === 'WINNER_CLEANUP'
      const isTimeoutAbort = abortReason === 'MODEL_TIMEOUT'
      const errorMsg = isTimeoutAbort ? 'MODEL_TIMEOUT' : rawErrorMsg

      const isRateLimited = errorMsg === 'RATE_LIMITED' || errorMsg.includes('HTTP 429')
      const isAuthError = errorMsg.startsWith('AUTH_ERROR_')
      const isBillingError = errorMsg === 'BILLING_REQUIRED'

      let failCount = modelFailures.get(model)?.failures || 0
      if (!isRateLimited && !isAuthError && !isBillingError && !isExpectedAbort) {
        failCount += 1
        modelFailures.set(model, { failures: failCount, lastFailedAt: Date.now() })
      }

      if (errorMsg === 'TTFT_TIMEOUT' || errorMsg === 'MODEL_TIMEOUT') {
        logger.debug(`TTFT timeout for ${model} (maxLatency: ${policy.maxLatency}ms)`)
      } else if (isExpectedAbort) {
        logger.debug(`Expected cancellation for ${model} (${abortReason}) - not counted as failure`)
      } else if (isRateLimited) {
        logger.debug(`Rate limited for ${model} (not counted as model failure)`)
      } else if (isAuthError) {
        logger.debug(`Authentication failure for ${model} (not counted as model failure)`)
      } else if (isBillingError) {
        logger.debug(`Billing/credits issue for ${model} (not counted as model failure)`)
      } else {
        logger.debug(`Model connection error: ${model} - ${errorMsg} (failures: ${failCount})`)
      }
      
      // Ensure the model request is fully cleaned up.
      if (!controller.signal.aborted) {
        controller.abort('CONNECT_ERROR')
      }
      throw err
    }
  }

  // ── Model Racing Loop ─────────────────────────────────────────────────────────
  for (let i = 0; i < models.length; i += MAX_CONCURRENT_MODELS) {
    const batch = models.slice(i, i + MAX_CONCURRENT_MODELS)
    attempts += batch.length
    
    const batchControllers = new Map<string, AbortController>()
    for (const m of batch) {
      batchControllers.set(m, new AbortController())
    }
    
    let globalTimeoutId: ReturnType<typeof setTimeout> | undefined

    try {
      const promises = batch.map(m => connectToModel(m, batchControllers.get(m)!))
      const elapsedMs = Date.now() - startTime
      const remainingGlobalMs = policy.globalTimeout - elapsedMs

      if (remainingGlobalMs <= 0) {
        logger.error('Global timeout reached before starting next model batch', new Error(`Elapsed: ${elapsedMs}ms`), { taskType: task })
        yield { type: 'error', error: 'Global timeout reached before model response' }
        return
      }

      const globalTimeoutPromise = new Promise<never>((_, reject) => {
        globalTimeoutId = setTimeout(() => reject(new Error('GLOBAL_TIMEOUT')), remainingGlobalMs)
      })

      const winner = await Promise.race([Promise.any(promises), globalTimeoutPromise])
      if (globalTimeoutId) clearTimeout(globalTimeoutId)

      // CRITICAL: Immediately abort all losing connections to prevent token waste
      for (const [model, controller] of batchControllers) {
        if (model !== winner.model) {
          try {
            controller.abort('RACE_LOST')
          } catch {
            logger.debug(`Failed to abort losing model: ${model}`)
          }
        }
      }

      logger.debug('Model won race', {
        winner: humanizeModel(winner.model),
        tier: winner.tier,
        ttftMs: winner.latency,
        attempts
      })

      yield { 
        type: 'model_selected', 
        model: winner.model, 
        modelHuman: humanizeModel(winner.model),
        tier: winner.tier,
        attempts 
      }

      if (winner.firstToken) {
        yield { type: 'token', content: winner.firstToken }
      }

      // ── Stream Remaining Tokens ──────────────────────────────────────────────────
      const { reader, decoder } = winner
      let buffer = winner.remainingBuffer
      let fullContent = winner.firstToken || ''

      const processChunk = function* (chunk: string): Generator<StreamEvent, void, unknown> {
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (!trimmed.startsWith('data: ')) continue

          try {
            if (!trimmed.includes('"content":')) continue
            const json = JSON.parse(trimmed.slice(6))
            const delta = json.choices?.[0]?.delta?.content
            
            if (delta) {
              fullContent += delta
              yield { type: 'token', content: delta }
            }
          } catch { }
        }
      }

      try {
        if (buffer) {
          const initial = buffer
          buffer = ''
          for (const event of processChunk(initial)) yield event
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          for (const event of processChunk(chunk)) yield event
        }
      } finally {
        try {
          await reader.cancel()
          winner.controller.abort() 
        } catch {
          logger.debug('Error cleaning up reader')
        }
      }

      logTelemetry({ 
        task, 
        model: winner.model, 
        tier: winner.tier, 
        latency: winner.latency, 
        success: true 
      })

      logger.info('Answer generation complete', {
        model: humanizeModel(winner.model),
        tokens: fullContent.length,
        ttftMs: winner.latency
      })

      yield {
        type: 'done',
        content: fullContent,
        model: winner.model,
        modelHuman: humanizeModel(winner.model),
        tier: winner.tier,
        latencyMs: winner.latency,
        attempts
      }
      return

    } catch (e) {
      if (globalTimeoutId) clearTimeout(globalTimeoutId)

      const isGlobalTimeout = e instanceof Error && e.message === 'GLOBAL_TIMEOUT'

      // Batch failed - abort all controllers and try next batch
      for (const controller of batchControllers.values()) {
        try {
          controller.abort(isGlobalTimeout ? 'GLOBAL_TIMEOUT_ABORT' : 'BATCH_ABORT')
        } catch {
          // Silently ignore
        }
      }

      const aggregateErrors = e instanceof AggregateError ? e.errors : [e]
      const messages = aggregateErrors.map(err =>
        err instanceof Error ? err.message : String(err)
      )

      if (messages.some(msg => msg === 'GLOBAL_TIMEOUT')) {
        logger.error('Global timeout reached during model race', new Error(`Elapsed: ${Date.now() - startTime}ms`), { taskType: task })
        yield { type: 'error', error: 'Global timeout reached before first token. Please retry with a shorter query.' }
        return
      }

      if (messages.some(msg => msg.startsWith('AUTH_ERROR_'))) {
        logger.error('OpenRouter authentication failed during model race')
        yield { type: 'error', error: 'OpenRouter authentication failed. Please verify OPENROUTER_API_KEY.' }
        return
      }

      if (messages.some(msg => msg === 'BILLING_REQUIRED')) {
        logger.error('OpenRouter billing/credits issue during model race')
        yield { type: 'error', error: 'OpenRouter account requires credits or billing setup.' }
        return
      }

      const allRateLimited = messages.length > 0 && messages.every(msg => msg === 'RATE_LIMITED' || msg.includes('HTTP 429'))
      if (allRateLimited) {
        logger.warn('OpenRouter rate limit reached across raced models')
        yield { type: 'error', error: 'OpenRouter rate limit reached. Please retry shortly.' }
        return
      }

      logger.debug(`Model batch failed (${batch.length} models)`)
      
      if (Date.now() - startTime > policy.globalTimeout) {
        logger.error('Global timeout reached', new Error(`Elapsed: ${Date.now() - startTime}ms`), { taskType: task })
        yield { type: 'error', error: 'Global timeout reached' }
        return
      }
    }
  }

  logger.error('All models failed to generate answer', new Error(`Task: ${task}`))
  yield { type: 'error', error: 'All models failed' }
}

// ── Streaming Answer Response (For API Routes) ──────────────────────────────
/**
 * Create a streaming response for search answer requests
 * Implements SSE (Server-Sent Events) format with NDJSON events
 * 
 * @param query - User search query
 * @param context - Search results to include as context
 * @param abortSignal - Signal to abort streaming (e.g., user navigated away)
 * @returns ReadableStream of NDJSON events compatible with EventSource
 */
export function createStreamingAnswerResponse(
  query: string,
  context?: { title: string; snippet: string; link: string }[],
  abortSignal?: AbortSignal
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  // Build system prompt with search context
  const contextText =
    context
      ?.map((r, i) => `[${i + 1}] "${r.title}": ${r.snippet}`)
      .join('\n') || ''

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: contextText 
        ? `${BASE_SYSTEM_PROMPT}\n\nSearch Context:\n${contextText}` 
        : BASE_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: query,
    },
  ]

  let isCancelled = false

  return new ReadableStream({
    async start(controller) {
      // Send grounding sources metadata immediately before starting AI stream
      if (context && context.length > 0) {
        const sourcesEvent: StreamEvent = {
          type: 'sources',
          sources: context.map(r => ({
            title: r.title,
            url: r.link,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(r.link).hostname}&sz=32`
          }))
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourcesEvent)}\n\n`))
      }

      // Handle client cancellation (e.g., user navigates away)
      abortSignal?.addEventListener('abort', () => {
        isCancelled = true
        logger.debug('Streaming cancelled by client')
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })

      try {
        // Stream events from model racing engine
        for await (const event of streamOpenRouter(messages, AITaskEnum.ANSWER)) {
          if (isCancelled) break
          
          // Format as NDJSON (newline-delimited JSON) for SSE
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        }

        if (!isCancelled) {
          controller.close()
        }
      } catch (error) {
        logger.error('Streaming error', error instanceof Error ? error.message : String(error))
        
        if (!isCancelled) {
          const errorEvent = { 
            type: 'error', 
            error: (error as Error).message || 'Stream processing failed' 
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
          controller.close()
        }
      }
    },
  })
}
