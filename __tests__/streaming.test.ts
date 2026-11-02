/**
 * Tests for the OpenRouter streaming engine (streaming.ts)
 *
 * The engine is the highest-complexity module in the codebase: it races
 * multiple model connections, applies tier-aware TTFT timeouts, aborts losing
 * connections, streams the winner's tokens, and wraps everything in an SSE
 * response for API routes. These tests exercise all of that against a
 * deterministic in-memory OpenRouter.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { StreamEvent } from '@/lib/openrouter/types'

// ── Speed up timeouts so tests run in milliseconds instead of seconds ────────
vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return {
    ...actual,
    TTFT_FAST_MS: 100,
    TTFT_SLOW_MS: 150,
    SYSTEMIC_FAILURE_THRESHOLD_MS: 300,
  }
})

// ── Deterministic key pool (controlled per test via testState) ───────────────
const testState = vi.hoisted(() => ({ keys: ['test-key-1'] as string[] }))

vi.mock('@/lib/env', () => ({
  getOpenRouterApiKeys: () => testState.keys,
}))

// ── Spy on key-pool side effects; keep getApiKeyPlan deterministic ───────────
const keyPoolSpies = vi.hoisted(() => ({
  getApiKeyPlan: vi.fn((keys: string[]) =>
    keys.map((key, i) => ({ key, label: `key-${i + 1}`, cooldownRemainingMs: 0 }))
  ),
  markApiKeySuccess: vi.fn(),
  markApiKeyAuthFailed: vi.fn(),
  markApiKeyBillingFailed: vi.fn(),
  markApiKeyRateLimited: vi.fn(),
}))

vi.mock('@/lib/openrouter/key-pool', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/openrouter/key-pool')>()
  return { ...actual, ...keyPoolSpies }
})

// ── Model list is injected per test via getModelsForTask ─────────────────────
vi.mock('@/lib/openrouter/models', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/openrouter/models')>()
  return {
    ...actual,
    getModelsForTask: vi.fn(async () => []),
  }
})

import { streamOpenRouter, createStreamingAnswerResponse } from '@/lib/openrouter/streaming'
import { getModelsForTask, modelFailures } from '@/lib/openrouter/models'
import { logger } from '@/lib/logger'

const getModelsForTaskMock = vi.mocked(getModelsForTask)
const markApiKeySuccess = keyPoolSpies.markApiKeySuccess

// ── Mock OpenRouter ───────────────────────────────────────────────────────────

type FetchBehavior =
  | { kind: 'sse'; chunks: Array<string | Uint8Array>; chunkDelayMs?: number }
  | { kind: 'status'; status: number }

const fetchBehaviors = new Map<string, FetchBehavior>()
const fetchCallSignals: AbortSignal[] = []

/** Match a fetch call by the model ID inside the request body */
function mockFetchFor(behaviors: Map<string, FetchBehavior>) {
  return vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}'))
    const behavior = behaviors.get(body.model) ?? { kind: 'status', status: 500 }
    const signal = init?.signal as AbortSignal | undefined
    if (signal) fetchCallSignals.push(signal)

    if (behavior.kind === 'status') {
      return new Response('{"error":"synthetic"}', { status: behavior.status })
    }

    const encoder = new TextEncoder()
    const encoded = behavior.chunks.map((c) => (typeof c === 'string' ? encoder.encode(c) : c))

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        if (signal) {
          signal.addEventListener(
            'abort',
            () => {
              try {
                controller.error(new Error(`ABORTED:${String(signal.reason)}`))
              } catch {
                /* already closed */
              }
            },
            { once: true }
          )
        }
        void (async () => {
          try {
            for (const chunk of encoded) {
              if (signal?.aborted) return
              if (behavior.chunkDelayMs) {
                await new Promise((r) => setTimeout(r, behavior.chunkDelayMs))
              }
              controller.enqueue(chunk)
            }
            controller.close()
          } catch {
            /* reader cancelled or stream aborted */
          }
        })()
      },
    })
    return new Response(stream, { status: 200 })
  })
}

/** Build one SSE data line for a content delta */
function sseLine(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`
}

// Model IDs chosen to match real tier patterns in config.ts
const MODEL_FAST_A = 'google/gemma-3-4b-it:free' // fast
const MODEL_FAST_B = 'google/gemma-3n-e4b-it:free' // fast

async function collectEvents(
  generator: AsyncGenerator<StreamEvent>
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = []
  for await (const event of generator) {
    events.push(event)
  }
  return events
}

/** Fully drain a ReadableStream, returning the decoded text */
async function drainStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let out = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    out += decoder.decode(value, { stream: true })
  }
  return out
}

function parseSseEvents(raw: string): StreamEvent[] {
  return raw
    .split('\n\n')
    .filter((block) => block.startsWith('data: '))
    .map((block) => JSON.parse(block.slice(6)))
}

beforeEach(() => {
  vi.clearAllMocks()
  modelFailures.clear()
  fetchBehaviors.clear()
  fetchCallSignals.length = 0
  testState.keys = ['test-key-1']
  getModelsForTaskMock.mockResolvedValue([])
  vi.stubGlobal('fetch', mockFetchFor(fetchBehaviors))
  // Keep test output quiet
  logger.setLogLevel('error')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('streamOpenRouter — racing', () => {
  it('streams the winning model: first token wins, loser connection aborted as RACE_LOST', async () => {
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_B, MODEL_FAST_A])

    // Loser sends its first token late (after the 100ms fast-tier TTFT window);
    // winner delivers quickly and is therefore selected by the race.
    fetchBehaviors.set(MODEL_FAST_B, {
      kind: 'sse',
      chunks: [sseLine('loser token'), 'data: [DONE]\n\n'],
      chunkDelayMs: 250,
    })
    fetchBehaviors.set(MODEL_FAST_A, {
      kind: 'sse',
      chunks: [sseLine('Hel'), sseLine('lo world')],
      chunkDelayMs: 15,
    })

    const events = await collectEvents(streamOpenRouter([{ role: 'user', content: 'hi' }]))

    expect(events[0]).toMatchObject({ type: 'model_selected', model: MODEL_FAST_A })
    const tokens = events.filter((e) => e.type === 'token')
    expect(tokens.map((e) => (e as { content: string }).content)).toEqual(['Hel', 'lo world'])
    expect(events.at(-1)).toMatchObject({ type: 'done', content: 'Hello world' })

    // The loser connection is the first fetch call made (batch order) and must
    // have been aborted by the racing engine, not by a timeout
    const loserSignal = fetchCallSignals[0]!
    expect(loserSignal.aborted).toBe(true)
    expect(String((loserSignal as AbortSignal & { reason?: unknown }).reason)).toBe('RACE_LOST')

    expect(markApiKeySuccess).toHaveBeenCalledWith('test-key-1')
  })

  it('assembles content across UTF-8 boundaries without corrupting characters', async () => {
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_A])

    // One SSE line whose JSON contains a multi-byte emoji; the encoded bytes
    // are split mid-codepoint to stress TextDecoder({ stream: true })
    const text = 'data: ' + JSON.stringify({ choices: [{ delta: { content: 'A😀B' } }] }) + '\n\n'
    const bytes = new TextEncoder().encode(text)
    const firstNonAscii = bytes.findIndex((b) => b > 0x7f)
    const splitAt = firstNonAscii + 2 // inside the 4-byte emoji sequence
    fetchBehaviors.set(MODEL_FAST_A, {
      kind: 'sse',
      chunks: [bytes.slice(0, splitAt), bytes.slice(splitAt)],
    })

    const events = await collectEvents(streamOpenRouter([{ role: 'user', content: 'hi' }]))
    expect(events.at(-1)).toMatchObject({ type: 'done', content: 'A😀B' })
  })

  it('aborts cleanly when the caller aborts before any model race starts', async () => {
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_A])
    fetchBehaviors.set(MODEL_FAST_A, { kind: 'sse', chunks: [sseLine('x')] })

    const controller = new AbortController()
    controller.abort()
    const events = await collectEvents(
      streamOpenRouter([{ role: 'user', content: 'hi' }], undefined, controller.signal)
    )

    expect(events).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('streamOpenRouter — failure taxonomy', () => {
  it('fails fast when no API keys are configured', async () => {
    testState.keys = []
    const events = await collectEvents(streamOpenRouter([{ role: 'user', content: 'hi' }]))
    expect(events).toEqual([{ type: 'error', error: 'No OpenRouter API key configured' }])
    expect(fetch).not.toHaveBeenCalled()
  })

  it('cools down the key and errors when every model is rate limited', async () => {
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_A])
    fetchBehaviors.set(MODEL_FAST_A, { kind: 'status', status: 429 })

    const events = await collectEvents(streamOpenRouter([{ role: 'user', content: 'hi' }]))

    expect(keyPoolSpies.markApiKeyRateLimited).toHaveBeenCalledWith('test-key-1')
    expect(events.at(-1)).toMatchObject({
      type: 'error',
      error: 'OpenRouter rate limit reached across all configured API keys. Please retry shortly.',
    })
    // Rate limiting is never counted as a model failure
    expect(modelFailures.size).toBe(0)
  })

  it('marks the key as auth-failed and errors on 401 responses', async () => {
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_A])
    fetchBehaviors.set(MODEL_FAST_A, { kind: 'status', status: 401 })

    const events = await collectEvents(streamOpenRouter([{ role: 'user', content: 'hi' }]))

    expect(keyPoolSpies.markApiKeyAuthFailed).toHaveBeenCalledWith('test-key-1')
    expect((events.at(-1) as { error?: string }).error).toMatch(/authentication/i)
  })

  it('reports billing failures distinctly', async () => {
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_A])
    fetchBehaviors.set(MODEL_FAST_A, { kind: 'status', status: 402 })

    const events = await collectEvents(streamOpenRouter([{ role: 'user', content: 'hi' }]))

    expect(keyPoolSpies.markApiKeyBillingFailed).toHaveBeenCalledWith('test-key-1')
    expect((events.at(-1) as { error?: string }).error).toMatch(/credits|billing/i)
  })

  it('short-circuits all-models failure within the systemic failure window', async () => {
    // Fill the failure tracker to the threshold with a *recent* timestamp
    modelFailures.set(MODEL_FAST_A, { failures: 3, lastFailedAt: Date.now() })
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_A])

    const events = await collectEvents(streamOpenRouter([{ role: 'user', content: 'hi' }]))

    expect(events).toEqual([
      { type: 'error', error: 'All AI models currently unavailable. API appears to be down.' },
    ])
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('createStreamingAnswerResponse — SSE envelope', () => {
  it('emits thinking + sources, then forwards the model stream', async () => {
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_A])
    fetchBehaviors.set(MODEL_FAST_A, { kind: 'sse', chunks: [sseLine('Answer body')] })

    const stream = createStreamingAnswerResponse('test query', [
      { title: 'Example', link: 'https://example.com/page', snippet: 'Some snippet' },
    ])

    const events = parseSseEvents(await drainStream(stream))

    expect(events[0]).toMatchObject({ type: 'thinking' })
    expect(events[1]).toMatchObject({
      type: 'sources',
      sources: [
        {
          title: 'Example',
          url: 'https://example.com/page',
          favicon: 'https://www.google.com/s2/favicons?domain=example.com&sz=32',
        },
      ],
    })
    expect(
      events.some((e) => e.type === 'model_selected' && (e as { model: string }).model === MODEL_FAST_A)
    ).toBe(true)
    expect(events.at(-1)).toMatchObject({ type: 'done', content: 'Answer body' })
  })

  it('renders grounded context into the system prompt sent to OpenRouter', async () => {
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_A])
    fetchBehaviors.set(MODEL_FAST_A, { kind: 'sse', chunks: [sseLine('Answer')] })
    const fetchMock = vi.mocked(fetch)

    const stream = createStreamingAnswerResponse('What is AI?', [
      { title: 'AI Overview', link: 'https://example.com', snippet: 'AI means machines thinking' },
    ])
    await drainStream(stream)

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const payload = JSON.parse(String(init.body))
    expect(payload.messages[0].role).toBe('system')
    expect(payload.messages[0].content).toContain('[1] "AI Overview": AI means machines thinking')
    expect(payload.messages[1]).toEqual({ role: 'user', content: 'What is AI?' })
  })

  it('stops enqueueing after the client cancels the stream', async () => {
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_A])
    fetchBehaviors.set(MODEL_FAST_A, {
      kind: 'sse',
      chunks: [sseLine('chunk one'), sseLine('chunk two'), sseLine('chunk three')],
      chunkDelayMs: 20,
    })

    const stream = createStreamingAnswerResponse('q', [])
    const reader = stream.getReader()

    // Read the first event(s), then cancel mid-stream
    await reader.read()
    await reader.cancel()

    // Subsequent reads resolve done without throwing
    const { done } = await reader.read()
    expect(done).toBe(true)
    expect(markApiKeySuccess).not.toHaveBeenCalled()
  })
})

describe('streamOpenRouter — request shape', () => {
  it('sends well-formed OpenRouter requests with attribution headers', async () => {
    getModelsForTaskMock.mockResolvedValue([MODEL_FAST_A])
    fetchBehaviors.set(MODEL_FAST_A, { kind: 'sse', chunks: [sseLine('ok')] })
    const fetchMock = vi.mocked(fetch)

    await collectEvents(streamOpenRouter([{ role: 'user', content: 'hello' }]))

    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://openrouter.ai/api/v1/chat/completions')
    expect(init?.method).toBe('POST')
    expect((init?.headers as Record<string, string>)['Authorization']).toBe('Bearer test-key-1')
    expect((init?.headers as Record<string, string>)['HTTP-Referer']).toBeTruthy()
    const payload = JSON.parse(String(init?.body))
    expect(payload.stream).toBe(true)
    expect(payload.model).toBe(MODEL_FAST_A)
    expect(payload.max_tokens).toBe(800) // ANSWER task budget from constants
  })
})
