/**
 * useStreamingAnswer Hook
 * 
 * Consumes the /api/ai/stream SSE endpoint and provides:
 * - Real-time token streaming
 * - State management (thinking, streaming, done, error)
 * - Model metadata when complete
 * 
 * Usage:
 * const { answer, state, model, startStream, reset } = useStreamingAnswer()
 * startStream('What is quantum computing?')
 */

'use client'

import { useState, useCallback, useRef } from 'react'

export type StreamState = 'idle' | 'thinking' | 'streaming' | 'done' | 'error'

export interface StreamMetadata {
  model: string
  modelHuman: string
  tier: string
  latencyMs: number
  attempts: number
  cached: boolean
}

interface StreamEvent {
  type: 'token' | 'thinking' | 'done' | 'error' | 'model_selected' | 'cache_hit' | 'sources'
  content?: string
  model?: string
  modelHuman?: string
  tier?: string
  latencyMs?: number
  attempts?: number
  error?: string
  cached?: boolean
  cachedAt?: number
  sources?: { title: string; url: string; favicon?: string }[]
}

// CRITICAL FIX: Add event validation before type casting to prevent runtime errors
// Previously: JSON.parse() returned unknown types, causing crashes on malformed API responses
function isValidStreamEvent(data: unknown): data is StreamEvent {
  if (typeof data !== 'object' || !data) return false
  const event = data as Record<string, unknown>
  const validTypes = ['token', 'thinking', 'done', 'error', 'model_selected', 'cache_hit', 'sources']
  if (!validTypes.includes(event.type as string)) return false
  if (event.content && typeof event.content !== 'string') return false
  if (event.model && typeof event.model !== 'string') return false
  if (event.modelHuman && typeof event.modelHuman !== 'string') return false
  if (event.sources && !Array.isArray(event.sources)) return false
  return true
}

export function useStreamingAnswer() {
  const [answer, setAnswer] = useState('')
  const [state, setState] = useState<StreamState>('idle')
  const [metadata, setMetadata] = useState<StreamMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sources, setSources] = useState<{ title: string; url: string; favicon?: string }[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const answerRef = useRef('')

  const reset = useCallback(() => {
    setAnswer('')
    answerRef.current = ''
    setState('idle')
    setMetadata(null)
    setError(null)
    setSources([])
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const startStream = useCallback(async (query: string) => {
    // Reset previous state
    reset()
    setState('thinking')

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(
        `/api/ai/stream?q=${encodeURIComponent(query)}`,
        { signal: abortControllerRef.current.signal }
      )

      if (!response.ok) {
        let errorMessage = `Request failed (HTTP ${response.status})`

        try {
          const contentType = response.headers.get('content-type') || ''

          if (contentType.includes('application/json')) {
            const body = await response.json() as { error?: string | { message?: string } }
            if (typeof body?.error === 'string') {
              errorMessage = body.error
            } else if (typeof body?.error?.message === 'string') {
              errorMessage = body.error.message
            }
          } else {
            const text = (await response.text()).trim()
            if (text) {
              errorMessage = text.slice(0, 200)
            }
          }
        } catch {
          // Keep default fallback message.
        }

        throw new Error(errorMessage)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let receivedDone = false
      let seenCacheHit = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const parsedData = JSON.parse(line.slice(6))
            
            // Validate before type casting - prevents runtime errors from malformed API responses
            if (!isValidStreamEvent(parsedData)) {
              console.warn('Received invalid stream event', parsedData)
              continue
            }
            
            const event: StreamEvent = parsedData

            switch (event.type) {
              case 'thinking':
                setState('thinking')
                break

              case 'sources':
                if (event.sources) setSources(event.sources)
                break

              case 'model_selected':
                setMetadata({
                  model: event.model || '',
                  modelHuman: event.modelHuman || '',
                  tier: event.tier || 'balanced',
                  latencyMs: 0,
                  attempts: event.attempts || 1,
                  cached: false,
                })
                break

              case 'cache_hit':
                seenCacheHit = true
                answerRef.current = event.content || ''
                setAnswer(answerRef.current)
                setMetadata({
                  model: event.model || '',
                  modelHuman: event.modelHuman || '',
                  tier: 'cached',
                  latencyMs: 0,
                  attempts: 0,
                  cached: true,
                })
                break

              case 'token':
                setState('streaming')
                answerRef.current += (event.content || '')
                setAnswer(answerRef.current)
                break

              case 'done':
                receivedDone = true
                setState('done')
                // Only use event.content if we haven't accumulated tokens
                // (i.e. cache_hit scenario where no tokens were streamed)
                if (event.content && answerRef.current.length === 0) {
                  answerRef.current = event.content
                  setAnswer(event.content)
                }
                setMetadata({
                  model: event.model || '',
                  modelHuman: event.modelHuman || '',
                  tier: event.tier || 'balanced',
                  latencyMs: event.latencyMs || 0,
                  attempts: event.attempts || 1,
                  cached: event.cached === true || event.cachedAt !== undefined || seenCacheHit,
                })
                break

              case 'error':
                receivedDone = true
                setState('error')
                setError(event.error || 'Unknown error')
                break
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Safety net: if the stream ended without a 'done' event
      // (e.g. server crash, abrupt disconnect), finalize the state
      if (!receivedDone && answerRef.current.length > 0) {
        setState('done')
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled, don't treat as error
        setState('idle')
      } else {
        setState('error')
        setError((err as Error).message)
      }
    }
  }, [reset])

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (state === 'streaming' || state === 'thinking') {
      setState('done')
    }
  }, [state])

  return {
    answer,
    state,
    metadata,
    error,    sources,    startStream,
    stop,
    reset,
    isLoading: state === 'thinking' || state === 'streaming',
  }
}
