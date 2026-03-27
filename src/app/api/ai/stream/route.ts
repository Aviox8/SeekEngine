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

import { createStreamingAnswerResponse } from '../../../../lib/openrouter'
import { getSerpResults } from '../../../../lib/serpapi'
import { getWebSearchResults } from '../../../../lib/google-search'
import { validateSearchQuery } from '../../../../lib/validation'
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '../../../../lib/rate-limit'
import { getCachedAnswer, setCachedAnswer, type CachedAnswer } from '../../../../lib/semantic-cache'
import { logger } from '../../../../lib/logger'
import { NextRequest } from 'next/server'

// Enable edge runtime for streaming support
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = getClientIP(request)
  const rl = checkRateLimit(`stream:${ip}`, RATE_LIMITS.stream)
  if (!rl.allowed) return rateLimitResponse(rl)

  const { searchParams } = new URL(request.url)
  
  // Validate query
  const validation = validateSearchQuery(searchParams)
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ error: validation.error }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const query = validation.query!
    logger.debug('Stream request', { query: query.slice(0, 50) })
  try {
    // 1. Semantic Cache check
    const cached = getCachedAnswer(query, 'stream')
    if (cached) {
      logger.info('Stream cache hit', { query: query.slice(0, 40) })
      const encoder = new TextEncoder()
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'cache_hit', content: cached.answer, model: cached.model, modelHuman: cached.modelHuman })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', cached: true })}\n\n`))
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

    // 2. Fetch search context for grounding
    logger.debug('Fetching RAG context', { query: query.slice(0, 50) })
    let context = await getSerpResults(query)
    let source = 'SerpApi'
    
    // Abort early if client disconnected during search
    if (request.signal.aborted) {
      return new Response(null, { status: 499 })
    }
    
    // Fallback if SerpApi empty
    if (!context || context.length === 0) {
       logger.debug('SerpApi had no results, using Google fallback')
       const googleResults = await getWebSearchResults(query)
       context = googleResults.map(r => ({
         title: r.title,
         snippet: r.snippet,
         link: r.link,
         source: r.displayLink || ''
       }))
       source = 'Google Search'
    }

    logger.debug('Context prepared', { resultCount: context.length, source })

    // 3. Create streaming response with cache write
    const stream = createStreamingAnswerResponse(
      query,
      context,
      request.signal
    )

    // CRITICAL FIX: Capture and cache tokens atomically
    // Previously: Shared variables without synchronization caused data corruption
    // during concurrent requests for same query
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    // Use closure to ensure each stream has isolated state
    let fullAnswer = ''
    let modelInfo = { model: '', modelHuman: '' }
    let cacheWritten = false

    const cacheTransform = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk)
        const text = decoder.decode(chunk, { stream: true })
        // Parse SSE events from chunk
        // Format: data: {"type":"token","content":"..."}\n\n
        for (const line of text.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'token' && data.content) fullAnswer += data.content
              if (data.model) modelInfo.model = data.model
              if (data.modelHuman) modelInfo.modelHuman = data.modelHuman
              // ATOMIC: Write cache only once, after completion
              if (data.type === 'done' && !cacheWritten) {
                cacheWritten = true
                if (fullAnswer.length > 50) {
                  const entry: CachedAnswer = {
                    answer: fullAnswer,
                    model: modelInfo.model,
                    modelHuman: modelInfo.modelHuman,
                    tier: 'stream',
                    latencyMs: 0,
                    attempts: 1,
                    cachedAt: Date.now(),
                    originalQuery: query,
                  }
                  setCachedAnswer(query, entry, 'stream')
                  logger.info('Stream answer cached', { length: fullAnswer.length })
                }
              }
            } catch { /* non-JSON data line */ }
          }
        }
      }
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
    logger.error('Stream endpoint error', error instanceof Error ? error.message : String(error))
    return new Response(
      JSON.stringify({ error: 'Failed to start stream' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
