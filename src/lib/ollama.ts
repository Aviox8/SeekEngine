/**
 * Ollama Cloud — OpenAI-compatible answer provider (second in the fallback chain).
 * Direct cloud inference at https://ollama.com/v1, authenticated with OLLAMA_API_KEY.
 */

import { OLLAMA_BASE_URL, OLLAMA_MODEL } from './env'
import { logger } from './logger'
import { TASK_POLICIES } from './openrouter/config'
import type { ChatMessage, StreamEvent, AITask } from './openrouter/types'
import { AITask as AITaskEnum } from './openrouter/types'

export function hasOllamaKey(): boolean {
  return !!process.env.OLLAMA_API_KEY
}

const DEFAULT_TTFT_MS = 10_000

/**
 * Stream a chat completion from Ollama Cloud as StreamEvents.
 * Yields an 'error' event (not throws) when the provider fails so callers
 * can continue down the fallback chain.
 */
export async function* streamOllama(
  messages: ChatMessage[],
  task: AITask = AITaskEnum.ANSWER,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.OLLAMA_API_KEY
  if (!apiKey) {
    yield { type: 'error', error: 'Ollama Cloud API key not configured' }
    return
  }

  const policy = TASK_POLICIES[task]
  const model = OLLAMA_MODEL
  const modelHuman = `Ollama · ${model}`
  const startedAt = Date.now()

  logger.info('Attempting Ollama Cloud answer', { model, task })

  const controller = new AbortController()
  const onExternalAbort = () => controller.abort('CLIENT_ABORT')
  if (signal?.aborted) {
    controller.abort('CLIENT_ABORT')
  } else {
    signal?.addEventListener('abort', onExternalAbort, { once: true })
  }

  const connectTimeout = setTimeout(() => controller.abort('MODEL_TIMEOUT'), DEFAULT_TTFT_MS + 2_000)

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: policy.temperature,
        max_tokens: policy.maxTokens,
        stream: true,
      }),
      signal: controller.signal,
    })

    if (!response.ok || !response.body) {
      const status = response.status
      const bodyText = await response.text().catch(() => '')
      throw new Error(`Ollama API error: HTTP ${status}${bodyText ? ` - ${bodyText}` : ''}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    let firstTokenSeen = false
    let ttftMs = 0

    try {
      while (true) {
        if (signal?.aborted) break

        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (!trimmed.startsWith('data: ')) continue

          try {
            const json = JSON.parse(trimmed.slice(6)) as {
              choices?: Array<{ delta?: { content?: string | null } }>
            }
            const delta = json.choices?.[0]?.delta?.content
            if (!delta) continue

            if (!firstTokenSeen) {
              firstTokenSeen = true
              ttftMs = Date.now() - startedAt
              clearTimeout(connectTimeout)
              yield {
                type: 'model_selected',
                model: `ollama/${model}`,
                modelHuman,
                tier: 'balanced',
                attempts: 1,
              }
              logger.info('Ollama Cloud produced first token', { model, ttftMs })
            }

            fullContent += delta
            yield { type: 'token', content: delta }
          } catch {
            // Ignore partial JSON lines between chunks.
          }
        }
      }
    } finally {
      try {
        await reader.cancel()
      } catch {
        // Stream already closed.
      }
    }

    if (!firstTokenSeen) {
      logger.warn('Ollama Cloud returned no tokens', { model })
      yield { type: 'error', error: 'Ollama Cloud returned an empty response' }
      return
    }

    logger.info('Ollama Cloud answer complete', {
      model,
      ttftMs,
      tokens: fullContent.length,
    })

    yield {
      type: 'done',
      content: fullContent,
      model: `ollama/${model}`,
      modelHuman,
      tier: 'balanced',
      latencyMs: ttftMs,
      attempts: 1,
    }
  } catch (error) {
    clearTimeout(connectTimeout)
    if (signal?.aborted) {
      logger.debug('Ollama Cloud stream aborted by client')
      return
    }
    const reason = controller.signal.aborted ? String((controller.signal as AbortSignal & { reason?: unknown }).reason ?? '') : ''
    if (reason === 'MODEL_TIMEOUT') {
      logger.warn('Ollama Cloud request timed out before first token', { model, timeoutMs: DEFAULT_TTFT_MS + 2_000 })
      yield { type: 'error', error: 'Ollama Cloud timed out' }
      return
    }
    logger.error('Ollama Cloud stream failed', error instanceof Error ? error : String(error))
    yield { type: 'error', error: 'Ollama Cloud failed' }
  } finally {
    clearTimeout(connectTimeout)
    signal?.removeEventListener('abort', onExternalAbort)
  }
}
