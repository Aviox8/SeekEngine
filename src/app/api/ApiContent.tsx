'use client'

import LegalPageShell, { LegalSection } from '../../components/ui/legal-page-shell'

const TOC = [
  { id: 'overview', label: 'Overview', summary: 'Base URL, auth, errors at a glance.' },
  { id: 'search', label: 'GET /api/search', summary: 'Merged web results, 30/min.' },
  { id: 'stream', label: 'POST /api/ai/stream', summary: 'SSE answer stream, 20/min.' },
  { id: 'suggest', label: 'GET /api/ai/suggest', summary: 'Query suggestions, 60/min.' },
  { id: 'cache-stats', label: 'GET /api/ai/cache/stats', summary: 'Ops telemetry, Bearer-guarded.' },
  { id: 'errors', label: 'Errors and limits', summary: 'Envelope, codes, Retry-After.' },
]

const STREAM_EVENTS = [
  ['thinking', 'The pipeline is grounded and the model is being brought up.'],
  ['sources', 'The grounding set, as title, url, favicon. emitted once, early.'],
  ['model_selected', 'Which model answered (model, modelHuman, tier).'],
  ['cache_hit', 'A cached answer was replayed; latency 0.'],
  ['token', 'One streamed token. Concatenate to build the answer.'],
  ['done', 'Terminal event: content, latencyMs, attempts, cached.'],
  ['error', 'Terminal failure event: error string.'],
]

export default function ApiContent() {
  return (
    <LegalPageShell
      accent="neutral"
      badge="API"
      badgeMeta="Public endpoints"
      title="API reference"
      intro="Every public endpoint SeekEngine itself uses. All routes run on the edge runtime, take plain query parameters or one JSON body, and are rate-limited per IP. No API keys are required and none are issued for the public surface."
      lastUpdated="2026-11-05"
      toc={TOC}
    >
      <LegalSection id="overview" index={0} total={TOC.length} tone="neutral" title="Overview" summary="The shape of the whole surface.">
        <p>Base URL is wherever you deployed the app. the examples here use <code>https://your-deployment.example.com</code>. All responses are JSON unless marked as a stream. There is no authentication for the public endpoints; abuse is handled with per-IP rate limits (429 + <code>Retry-After</code>).</p>
        <p>One endpoint is operator-only: <code>/api/ai/cache/stats</code>. One endpoint exists purely for infrastructure and is intentionally undocumented here: <code>/api/cron/redis-warm</code>.</p>
        <p>Internal contract, stable within this project: errors always use the envelope <code>{'{ error: { code, message, retryable } }'}</code>.</p>
      </LegalSection>

      <LegalSection id="search" index={1} total={TOC.length} tone="neutral" title="GET /api/search" summary="Returns the merged grounding set. 30 requests per minute per IP.">
        <pre className="overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">{`curl "https://your-deployment.example.com/api/search?q=interstellar+hotel&time=w"`}</pre>
        <ul className="list-disc space-y-1 pl-5">
          <li><code>q</code> (required). the query. 1–500 characters.</li>
          <li><code>time</code> (optional). <code>h</code>, <code>d</code>, <code>w</code>, <code>m</code> or <code>y</code>. Empty means any time.</li>
        </ul>
        <pre className="overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">{`{
  "results": [
    {
      "title": "…",
      "link": "https://…",
      "snippet": "…",
      "source": "exa"
    }
  ]
}`}</pre>
        <p>Results come from the parallel fan-out described in the docs: SerpAPI, Google CSE, Exa and DuckDuckGo are queried concurrently, merged with deduplication and capped at 12. The endpoint answers with whatever survived.</p>
      </LegalSection>

      <LegalSection id="stream" index={2} total={TOC.length} tone="neutral" title="POST /api/ai/stream" summary="Streams the grounded answer as server-sent events. 20 requests per minute per IP.">
        <pre className="overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">{`curl -N -X POST "https://your-deployment.example.com/api/ai/stream" \\
  -H "Content-Type: application/json" \\
  -d '{"q":"why is the sky blue"}'`}</pre>
        <p>Body: <code>q</code> (required), optional <code>time</code> (same codes as search), optional <code>context</code>. an array of <code>{'{ title, link, snippet }'}</code>. When <code>context</code> is present it is used as the grounding set instead of searching again; that is how the results page streams against the results you are already reading.</p>
        <p>Response is <code>text/event-stream</code>. Each event is one line: <code>data: {'{ … }'}</code>. Event types, in the order they usually appear:</p>
        <ul className="space-y-1.5 pl-0">
          {STREAM_EVENTS.map(([type, desc]) => (
            <li key={type} className="flex items-baseline gap-3 text-[13px]">
              <code className="shrink-0 rounded-md bg-foreground/[0.06] px-2 py-0.5 font-mono text-[11px]">{type}</code>
              <span className="text-foreground/65">{desc}</span>
            </li>
          ))}
        </ul>
        <p>The stream ends after a <code>done</code> or <code>error</code> event. If the network drops mid-answer, whatever tokens were emitted remain valid context for the user. we never swap providers mid-answer.</p>
      </LegalSection>

      <LegalSection id="suggest" index={3} total={TOC.length} tone="neutral" title="GET /api/ai/suggest" summary="High-value query suggestions, cached. 60 requests per minute per IP.">
        <pre className="overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">{`curl "https://your-deployment.example.com/api/ai/suggest?q=obsidian"`}</pre>
        <p>Returns <code>{'{ suggestions: string[], model, modelHuman, latencyMs, attempts, cached }'}</code>. Suggestions are generated by the configured model pool and cached for 10 minutes, so identical prefixes are essentially free to serve.</p>
      </LegalSection>

      <LegalSection id="cache-stats" index={4} total={TOC.length} tone="neutral" title="GET /api/ai/cache/stats" summary="Operator telemetry. Bearer-guarded, 10 requests per minute.">
        <p>This endpoint is for operators, not for the public. It requires an <code>Authorization: Bearer &lt;secret&gt;</code> header whose value matches <code>CACHE_STATS_SECRET</code> (or <code>ADMIN_SECRET</code>), and it is rate-limited to 10 requests per minute per IP.</p>
        <pre className="overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">{`curl "https://your-deployment.example.com/api/ai/cache/stats" \\
  -H "Authorization: Bearer <your-secret>"`}</pre>
        <p>Returns cache size, hit rate, TTL distribution and how many expired entries were swept: <code>{'{ size, hits, misses, expired, clearedExpired, timestamp }'}</code>. Missing secret configuration returns 500 <code>SERVER_MISCONFIGURED</code>; a wrong token returns 401.</p>
      </LegalSection>

      <LegalSection id="errors" index={5} total={TOC.length} tone="neutral" title="Errors and limits" summary="One envelope, a fixed code vocabulary.">
        <p>Every failure uses the same envelope:</p>
        <pre className="overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">{`{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryable": true
  }
}`}</pre>
        <ul className="list-disc space-y-1 pl-5">
          <li><code>INVALID_QUERY</code>. malformed <code>q</code> or <code>time</code>. 400.</li>
          <li><code>RATE_LIMIT_EXCEEDED</code>. 429 with <code>Retry-After</code>. Back off, retry.</li>
          <li><code>API_KEY_MISSING</code>. the deployment is missing a provider key. 500.</li>
          <li><code>EXTERNAL_API_FAILED</code>. an upstream provider broke. 502.</li>
          <li><code>MODEL_UNAVAILABLE</code>. the model pool is exhausted or rate-limited. 503.</li>
          <li><code>TIMEOUT</code>. an upstream call exceeded its budget. 504.</li>
          <li><code>INTERNAL_ERROR</code>. everything else; retry once, then report.</li>
        </ul>
        <p>Per-IP limits: search 30/min, stream 20/min, suggest 60/min, cache-stats 10/min. Rate limiting fails open: if the limiter itself is down, requests are allowed. never blocked by your own infrastructure.</p>
      </LegalSection>
    </LegalPageShell>
  )
}
