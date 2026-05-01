/**
 * API Route: /api/ai/stream
 * Returns streaming AI-generated answer via Server-Sent Events (SSE)
 * With semantic cache integration for instant cached responses
 * 
 * Events emitted:
 * - cache_hit: Instant cached response (no streaming needed)
 * - thinking: Initial connection state
 * - model_selected: Which model was chosen
 * - token: Each token as it arrives
 * - done: Final completion with metadata
 * - error: If something went wrong
 */

import { NextRequest } from 'next/server'
import { createStreamingAnswerResponse } from '@/lib/openrouter'
import { validateSearchQuery, validateSearchQueryValue, validateTimeRange } from '@/lib/validation'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit'
import { getCachedAnswer, setCachedAnswer, type CachedAnswer } from '@/lib/semantic-cache'
import { logger } from '@/lib/logger'
import { getOpenRouterApiKeys } from '@/lib/env'
import { createErrorResponse, Errors } from '@/lib/errors'
import { getSearchContext, type SearchContextItem } from '@/lib/search-context'
import type { TimeRangeCode } from '@/lib/constants'

// Enable edge runtime for streaming support
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

interface ParsedStreamRequest {
  query: string
  timeRange?: TimeRangeCode
  context: SearchContextItem[]
  hasProvidedContext: boolean
}

function jsonErrorResponse(error: unknown): Response {
  const { error: errorBody, status } = createErrorResponse(error)
  return new Response(JSON.stringify(errorBody), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function normalizeContext(context: unknown): SearchContextItem[] {
  if (!Array.isArray(context)) {
    return []
  }

  return context
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title.trim() : '',
      link: typeof item.link === 'string' ? item.link.trim() : '',
      snippet: typeof item.snippet === 'string' ? item.snippet.trim() : '',
    }))
    .filter((item) => item.title && item.link && item.snippet)
    .slice(0, 10)
}

async function parseStreamRequest(request: NextRequest): Promise<ParsedStreamRequest> {
  if (request.method === 'GET') {
    const { searchParams } = new URL(request.url)
    const validation = validateSearchQuery(searchParams)
    if (!validation.valid) {
      throw Errors.invalidQuery(validation.error)
    }

    const timeValidation = validateTimeRange(searchParams.get('time'))
    if (!timeValidation.valid) {
      throw Errors.invalidQuery(timeValidation.error)
    }

    return {
      query: validation.query!,
      timeRange: timeValidation.timeRange,
      context: [],
      hasProvidedContext: false,
    }
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    throw Errors.invalidInput('body', 'Expected a valid JSON payload')
  }

  if (typeof payload !== 'object' || payload === null) {
    throw Errors.invalidInput('body', 'Expected a JSON object')
  }

  const body = payload as Record<string, unknown>
  const validation = validateSearchQueryValue(
    typeof body.q === 'string' ? body.q : null
  )
  if (!validation.valid) {
    throw Errors.invalidQuery(validation.error)
  }

  const timeValidation = validateTimeRange(
    typeof body.time === 'string' ? body.time : undefined
  )
  if (!timeValidation.valid) {
    throw Errors.invalidQuery(timeValidation.error)
  }

  const hasProvidedContext = Object.prototype.hasOwnProperty.call(body, 'context')

  return {
    query: validation.query!,
    timeRange: timeValidation.timeRange,
    context: normalizeContext(body.context),
    hasProvidedContext,
  }
}

function getStreamCacheTask(timeRange?: TimeRangeCode): string {
  return timeRange ? `stream:${timeRange}` : 'stream'
}

async function handleRequest(request: NextRequest) {
  // CRITICAL: Validate API key early to fail fast instead of streaming for 10+ seconds
  if (getOpenRouterApiKeys().length === 0) {
    logger.error('No OpenRouter API keys configured at stream endpoint')
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Please set OPENROUTER_API_KEY or OPENROUTER_API_KEYS.' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Rate limiting
  const ip = getClientIP(request)
  const rl = checkRateLimit(`stream:${ip}`, RATE_LIMITS.stream)
  if (!rl.allowed) return rateLimitResponse(rl)

  try {
    const { query, timeRange, context, hasProvidedContext } = await parseStreamRequest(request)
    const cacheTask = getStreamCacheTask(timeRange)
    logger.debug('Stream request', {
      query: query.slice(0, 50),
      timeRange,
      providedContext: hasProvidedContext,
    })

    // 1. Semantic Cache check
    const cached = getCachedAnswer(query, cacheTask)
    if (cached) {
      logger.info('Stream cache hit', { query: query.slice(0, 40) })
      const encoder = new TextEncoder()
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'cache_hit', content: cached.answer, model: cached.model, modelHuman: cached.modelHuman })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            content: cached.answer,
            model: cached.model,
            modelHuman: cached.modelHuman,
            tier: 'cached',
            latencyMs: 0,
            attempts: 0,
            cached: true,
            cachedAt: cached.cachedAt,
          })}\n\n`))
          controller.close()
        }
      })
      return new Response(body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Cache': 'HIT',
        },
      })
    }

    // 2. Create streaming response with cache write
    const contextLoader = async () => {
      if (hasProvidedContext) {
        logger.debug('Using client-provided search context for stream', {
          query: query.slice(0, 50),
          resultCount: context.length,
        })
        return context
      }

      try {
        const searchContext = await getSearchContext(query, timeRange, request.signal)
        logger.debug('Fetched server-side search context for stream', {
          query: query.slice(0, 50),
          resultCount: searchContext.results.length,
          provider: searchContext.provider,
          cached: searchContext.cached,
        })
        return searchContext.results.map(({ title, link, snippet }) => ({
          title,
          link,
          snippet,
        }))
      } catch (error) {
        if (request.signal.aborted) {
          throw error
        }

        logger.warn('Search context unavailable for stream, continuing without grounding', {
          query: query.slice(0, 50),
          timeRange,
        })
        return []
      }
    }

    const stream = createStreamingAnswerResponse(
      query,
      contextLoader,
      request.signal
    )

    // CRITICAL FIX: Capture and cache tokens atomically
    // Previously: Shared variables without synchronization caused data corruption
    // during concurrent requests for same query. Using AbortSignal ensures cleanup.
    const decoder = new TextDecoder()
    let fullAnswer = ''
    const modelInfo = { model: '', modelHuman: '' }
    let cacheWritten = false
    let streamBuffer = ''

    const processEventBlock = (block: string) => {
      for (const line of block.split('\n')) {
        if (!line.startsWith('data: ')) {
          continue
        }

        try {
          const data = JSON.parse(line.slice(6)) as {
            type?: string
            content?: string
            model?: string
            modelHuman?: string
            tier?: string
            latencyMs?: number
            attempts?: number
          }

          if (data.type === 'token' && data.content) {
            fullAnswer += data.content
          }
          if (data.model) {
            modelInfo.model = data.model
          }
          if (data.modelHuman) {
            modelInfo.modelHuman = data.modelHuman
          }
          if (data.type === 'done' && !cacheWritten) {
            const finalAnswer = fullAnswer || data.content || ''
            if (finalAnswer.length > 50) {
              cacheWritten = true
              const entry: CachedAnswer = {
                answer: finalAnswer,
                model: modelInfo.model,
                modelHuman: modelInfo.modelHuman,
                tier: data.tier || 'stream',
                latencyMs: data.latencyMs || 0,
                attempts: data.attempts || 1,
                cachedAt: Date.now(),
                originalQuery: query,
              }
              setCachedAnswer(query, entry, cacheTask)
              logger.info('Stream answer cached', {
                length: finalAnswer.length,
                queryLen: query.length,
                task: cacheTask,
              })
            }
          }
        } catch {
          // Ignore malformed SSE event payloads.
        }
      }
    }

    const cacheTransform = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk)
        try {
          streamBuffer += decoder.decode(chunk, { stream: true })
          const eventBlocks = streamBuffer.split('\n\n')
          streamBuffer = eventBlocks.pop() || ''

          for (const block of eventBlocks) {
            processEventBlock(block)
          }
        } catch (e) {
          logger.debug('Error in cache transform', { error: e instanceof Error ? e.message : 'Unknown' })
        }
      },
      flush() {
        const trailingBlock = streamBuffer.trim()
        if (trailingBlock) {
          processEventBlock(trailingBlock)
        }
      },
    })

    const cachedStream = stream.pipeThrough(cacheTransform)
    
    return new Response(cachedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    // Don't log full error details to prevent accidental secret exposure
    if (errorMsg.includes('AbortError')) {
      logger.debug('Stream request aborted by client')
    } else {
      logger.error('Stream endpoint error', new Error(errorMsg.slice(0, 100)))
    }
    return jsonErrorResponse(
      error instanceof Error ? error : Errors.invalidInput('request', 'Failed to start stream')
    )
  }
}

export const GET = handleRequest
export const POST = handleRequest
