# SeekEngine Architecture Documentation

## Overview

SeekEngine is a modern AI-enhanced search engine that synthesizes web search results into comprehensive AI-generated answers. It operates on pragmatic architectural principles:

- **Edge-first**: All APIs run on edge runtime for <100ms cold starts
- **Graceful degradation**: Multiple fallbacks for every critical path
- **Model racing**: Concurrent requests to AI models, using fastest response
- **Smart caching**: Semantic query normalization prevents duplicate API calls
- **User-centric**: Minimalist design, real-time streaming, keyboard shortcuts

---

## System Architecture

### High-Level Flow

```
User Query
    ↓
[Frontend] SearchBar (React)
    ↓ (debounced, validat)
[API] /api/ai/suggest → AI Suggestions (cached)
    ↓
User Selects / Submits
    ↓
[Frontend] Router → /results?q=...
    ↓
Parallel Requests:
├─→ [API] /api/search → Web Results (SerpAPI → Google fallback)
└─→ [API] /api/ai/stream → AI Answer (SSE streaming)
    ↓
[Frontend] Display Results + Streaming Answer
    ↓
User Can Follow-up (/forward query)
```

### Core Data Flow

1. **Query Input**: User types in SearchBar
2. **Suggestion Phase**: useSearch hook debounce (300ms) → `/api/ai/suggest`
3. **Execution Phase**: User submits → router navigates to `/results?q=...`
4. **Result Fetch**: ResultsClient fetches:
   - `/api/search?q=...` (web results, 30/min rate limit)
   - `/api/ai/stream?q=...` (AI answer via SSE, 20/min rate limit)
5. **Streaming Display**: useStreamingAnswer consumes SSE events, displays tokens as they arrive
6. **Caching**: Semantic cache intercepts repeated queries (after normalization)

---

## API Routes

### /api/search
**Purpose**: Aggregate web search results from multiple providers

**Method**: GET
**Rate Limit**: 30 requests/min per IP
**Runtime**: Edge

**Query Params**:
```typescript
{
  q: string          // Required, 2-500 characters
  time?: 'h'|'d'|'w'|'m'|'y'  // Optional: last hour/day/week/month/year
}
```

**Response**:
```json
{
  "results": [
    {
      "title": "Result Title",
      "link": "https://example.com",
      "snippet": "Relevant excerpt from page",
      "source": "example.com"
    }
  ]
}
```

**Error Responses**: Standardized error format with HTTP status codes and retry information

**Providers**:
1. **Primary**: SerpAPI (real-time Google search)
2. **Secondary**: Google Custom Search API
3. **None**: Returns empty results

---

### /api/ai/stream
**Purpose**: Stream real-time AI-generated answers with web context

**Method**: GET
**Rate Limit**: 20 requests/min per IP
**Runtime**: Edge
**Protocol**: Server-Sent Events (SSE) with NDJSON

**Query Params**:
```typescript
{
  q: string  // Required: search query
}
```

**Response Format**: NDJSON events via SSE

Events:
```typescript
// Initial state
{ type: 'thinking', content: 'Connecting to AI...' }

// After cache check or model selection
{ 
  type: 'cache_hit',     // If answer already cached
  content: 'cached answer text',
  cachedAt: 1234567890,
  model: 'cache'
}

// During model racing
{
  type: 'model_selected',
  model: 'meta-llama/llama-3.3-70b-instruct:free',
  modelHuman: 'LLaMA 3.3 70B',
  tier: 'heavy',
  attempts: 2  // How many models were tried
}

// Each token as it arrives
{ type: 'token', content: 'Hello' }
{ type: 'token', content: ' world' }

// Completion
{
  type: 'done',
  content: 'Full answer text...',
  model: 'meta-llama/llama-3.3-70b-instruct:free',
  modelHuman: 'LLaMA 3.3 70B',
  tier: 'heavy',
  latencyMs: 1234,
  attempts: 2
}

// Error
{ type: 'error', error: 'All models failed' }
```

---

### /api/ai/suggest
**Purpose**: AI-powered search completions/suggestions

**Method**: GET
**Rate Limit**: 60 requests/min per IP
**Runtime**: Edge

**Query Params**:
```typescript
{
  q: string  // Partial query, e.g., "what is qua"
}
```

**Response**:
```json
{
  "suggestions": [
    "what is quantum computing",
    "what is quantum entanglement",
    "what is quantum mechanics"
  ]
}
```

---

### /api/ai/cache/stats
**Purpose**: Monitoring endpoint - view cache hit rate and performance

**Method**: GET
**Runtime**: Edge

**Response**:
```json
{
  "hitRate": 0.42,
  "cacheSize": 248,
  "entries": 248,
  "maxEntries": 500,
  "cleared": 3
}
```

---

## Model Racing Strategy

### Algorithm

The streaming engine implements "first-token-wins" model racing:

1. **Sort Models**: By task preference + health (failure count)
2. **Batch Race**: Try 3-5 models concurrently
3. **First Token**: Return model that produces first token fastest
4. **Abort Losers**: Immediately abort other model connections (zero waste)
5. **Stream Winner**: Stream all remaining tokens from winning model
6. **On Failure**: Try next batch until success or timeout

### Tier-Based TTFT (Time To First Token)

Models are classified and racing is aware of speed tiers:

```typescript
tier 'fast':      2000ms TTFT timeout (Gemini Flash, Qwen 4B, etc.)
tier 'balanced':  5000ms TTFT timeout (Mistral, DeepSeek, etc.)
tier 'heavy':     5000ms TTFT timeout (LLaMA 70B+, etc.)
```

### Example Race

```
Time 0ms:    Start race: Model A, Model B, Model C
Time 523ms:  Model B produces first token → WINS ✓
Time 524ms:  Abort Model A and Model C (zero waste)
Time 525ms:  Begin streaming Model B's response
Time 3521ms: Model B completes
```

---

## Caching Strategy

### Semantic Cache

Prevents duplicate API calls for the same question asked different ways.

**Normalization**:
- Lowercase + trim
- Remove punctuation
- Remove "structural filler" words (can, the, a, will, etc.)
- But preserve semantic words (how, why, what, is, does, etc.)
- Collapse whitespace

**Examples**:
```
"What is quantum computing?" →  "what quantum computing"
"what is quantum computing" →   "what quantum computing" ✓ SAME
"What's quantum computing?" →   "what quantum computing" ✓ SAME
```

**Cache Key**: `{task}:{normalized_query}`

**TTL**: 30 minutes
**Max Entries**: 500 (LRU eviction)

### Instant Cache Hits

When a cached query is hit:
1. Stream `cache_hit` event immediately
2. Return full cached answer without API call
3. Save ~5 seconds per query + API costs

---

## Error Handling & Resilience

### Standardized Error Format

All API errors follow a consistent structure:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED" | "INVALID_QUERY" | "API_KEY_MISSING" | etc.,
    "message": "Human-readable error message",
    "retryable": true | false
  }
}
```

### Graceful Degradation

**Search Results**: 
1. Try SerpAPI
2. Fall back to Google Custom Search
3. If both fail, return empty results (UI shows "No results")

**AI Models**:
1. Try model from preferred tier
2. Track failures per model
3. Skip models after 3 failures
4. Try next batch
5. If all models exhausted, return generic error

**Rate Limiting**:
- Returns 429 with `Retry-After` header
- Clients can wait and retry automatically

---

## Performance Optimizations

### Edge Runtime

All `/api/*` routes run on Vercel Edge Runtime:
- **Cold Start**: <100ms
- **Regions**: Auto-replicated globally
- **Memory**: Limited but sufficient for:~100,000 concurrent rate limit entries in memory
- Semantic cache (<500 entries)
-Model list cache (rotated 10 min)

### Connection Pooling

- OpenRouter: Reuses HTTP connections via Keep-Alive
- Search APIs: Connections pooled per request (edge stateless)

### Token Streaming

- Real-time: Users see answer as it's being generated (no waterfall delay)
- Memory efficient: Chunks streamed to browser, not buffered server-side

---

## Security Measures

### Input Validation

- Min/max query lengths (2-500 chars)
- UTF-8 encoding validation
- Removal of potentially malicious characters (<>, quotes, semicolons)
- SQL injection pattern detection (warnings logged)

### Rate Limiting

- Per-IP sliding window counters
- Prevents token abuse and runaway costs
- Edge-native (no Redis required)

### API Keys

- Environment validation at startup
- Production build enforces OPENROUTER_API_KEY
- Optional keys degrade gracefully (search fallbacks)

### CORS & Headers

- Content-Type: application/json
- No sensitive data in error messages
- Proper HTTP status codes (400, 429, 500, etc.)

---

## Development Workflow

### Setup

```bash
# 1. Clone and install
git clone github.com/archduke1337/seekengine.git
npm install

# 2. Create .env.local
cp .env.example .env.local
# Fill in OPENROUTER_API_KEY (required), optional SerpAPI/Google keys

# 3. Run development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

### Testing

```bash
# Run test suite
npm test

# Watch mode (re-run on file changes)
npm test:watch

# Coverage report
npm test -- --coverage
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# On Vercel: Simply push to main branch, it auto-deploys
```

---

## Debugging

### Logging

All major operations log via structured logger:

```typescript
logger.debug('Operation details', { contextKey: value })
logger.info('Important event', { data })
logger.warn('Degraded behavior', { reason })
logger.error('Fatal issue', errorObject)
```

**Log Levels**:
- `debug`: Development only
- `info`: Key metrics/status
- `warn`: Fallback usage, API failures
- `error`: Fatal issues, all fails

### Telemetry

Model performance tracked automatically:
```typescript
✅ [ANSWER] meta-llama/llama-3.3-70b-instruct:free
   tier=heavy latency=1523ms success=true
```

### Monitoring Endpoints

- `/api/ai/cache/stats` - Cache hit rate and size
- Browser DevTools - Network tab shows SSE stream events

---

## Future Enhancements

Potential improvements documented as issues/PRs:

1. **Conversation Context**: Multi-turn dialogue with history
2. **Citations**: Extract source citations with links
3. **Cost Dashboard**: Show API costs per query
4. **Custom Models**: Allow users to select model preference
5. **Search Filters**: Domain/language/time filters
6. **Analytics**: Query analytics, popular searches
7. **Offline Support**: Service worker caching
8. **Mobile App**: Native iOS/Android clients

---

## File Structure Reference

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts          # Web search aggregation
│   │   └── ai/
│   │       ├── stream/route.ts      # Streaming answers (main)
│   │       ├── suggest/route.ts     # AI suggestions
│   │       └── cache/stats/route.ts # Cache monitoring
│   ├── layout.tsx
│   ├── page.tsx                     # Home page
│   ├── results/                     # Search results page
│   └── about/                       # About page
│
├── components/
│   ├── search/                      # Search UI components
│   ├── footer/                      # Footer (Canvas animations)
│   ├── layout/                      # Layout wrapper components
│   └── ui/                          # Base UI components (Radix)
│
├── hooks/
│   ├── useSearch.ts                 # Search query + suggestions state
│   ├── useStreamingAnswer.ts        # SSE stream consumer
│   └── useSearchHistory.ts          # localStorage persistence
│
├── lib/
│   ├── constants.ts                 # 🆕 Magic numbers (rates, timeouts)
│   ├── errors.ts                    # 🆕 Error types + standardized format
│   ├── logger.ts                    # 🆕 Structured logging
│   ├── sanitize.ts                  # 🆕 Input sanitization
│   ├── env.ts                       # Updated: Better validation
│   ├── rate-limit.ts                # Updated: Uses constants, error types
│   ├── validation.ts                # Zod schemas
│   ├── semantic-cache.ts            # Query normalization + cache
│   ├── google-search.ts             # Google fallback integration
│   ├── serpapi.ts                   # SerpAPI integration
│   └── openrouter/
│       ├── streaming.ts             # ✅ Fixed: Race condition, logging
│       ├── models.ts                # ✅ Refactored: Registry-based
│       ├── client.ts                # Low-level API client
│       ├── config.ts                # Task policies, fallback models
│       ├── answers.ts               # Answer generation
│       └── suggestions.ts           # Suggestion generation
│
└── globals.css                      # Global styles
```

---

## Contributing Guidelines

1. **Create feature branch**: `git checkout -b feature/xyz`
2. **Follow TypeScript strict mode**: All code must pass type checking
3. **Add JSDoc comments**: Exported functions need documentation
4. **Write tests**: 80% coverage target for critical paths
5. **Standardize errors**: Use `Errors.*` factory functions
6. **Use logger**: Replace console.log with `logger.*`
7. **Commit message**: Descriptive, lowercase: `feat: add rate limit bypass`
8. **Create PR**: Link to issues, reference related PRs

---

## Deployment Checklist

- [ ] All tests passing: `npm test`
- [ ] No TypeScript errors: `npm run build`
- [ ] No linting issues: `npm run lint`
- [ ] Environment variables set on Vercel (OPENROUTER_API_KEY at minimum)
- [ ] Optional search keys configured (SerpAPI or Google Search)
- [ ] Monitoring dashboard configured
- [ ] Rollback plan documented

---

**Last Updated**: March 27, 2026
**Maintainer**: SeekEngine Team
