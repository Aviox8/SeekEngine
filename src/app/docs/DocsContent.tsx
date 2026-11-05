'use client'

import LegalPageShell, { LegalSection } from '../../components/ui/legal-page-shell'

const TOC = [
  { id: 'how-it-works', label: 'How it works', summary: 'Fan-out, merge, stream, fall back.' },
  { id: 'quickstart', label: 'Quickstart', summary: 'Clone to running in five minutes.' },
  { id: 'deploy', label: 'Deploy to Vercel', summary: 'Edge runtime, env vars, shared cache.' },
  { id: 'configuration', label: 'Configuration', summary: 'Every environment variable, grouped.' },
  { id: 'project-layout', label: 'Project layout', summary: 'Where everything lives in the code.' },
  { id: 'troubleshooting', label: 'Troubleshooting', summary: 'The failures we actually see.' },
]

export default function DocsContent() {
  return (
    <LegalPageShell
      accent="neutral"
      badge="Documentation"
      badgeMeta="Self-hosting guide"
      title="Documentation"
      intro="Everything needed to run SeekEngine on your own infrastructure — from a bare clone to an edge deployment with a shared cache — plus where to look when something misbehaves."
      lastUpdated="2026-11-05"
      toc={TOC}
    >
      <LegalSection id="how-it-works" index={0} total={TOC.length} tone="neutral" title="How it works" summary="Fan-out, merge, stream — no sequential fallbacks.">
        <p>SeekEngine is not one wrapper around one API. Every search fans out in <strong>parallel</strong> against SerpAPI, Google Custom Search, Exa (neural, primary for fresh OSINT-style retrieval) and a keyless DuckDuckGo scrape. Results are merged, deduplicated by link, and capped at 12 grounding results.</p>
        <p>That grounding set is the <em>only</em> context the answer pipeline may use. The model streams from OpenRouter (default <code>openrouter/free</code>); if it fails before emitting a token, Ollama Cloud takes over (default <code>beam:cloud</code>); if every LLM is down, a deterministic local synthesis writes a citation-linked answer from the raw search context. Mid-stream failures keep the partial answer — providers never swap mid-answer.</p>
        <p>Search results are cached for 15 seconds, semantic answers for 30 minutes, suggestions for 10 minutes. Caches live in a shared Redis when configured; otherwise each instance falls back to in-memory, which is fine for a single instance and misleading for a fleet.</p>
      </LegalSection>

      <LegalSection id="quickstart" index={1} total={TOC.length} tone="neutral" title="Quickstart" summary="Five minutes, one API key, zero accounts.">
        <pre className="overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">{`git clone https://github.com/archduke1337/SeekEngine.git
cd SeekEngine
npm install
cp .env.example .env.local
# set OPENROUTER_API_KEY in .env.local — everything else is optional
npm run dev`}</pre>
        <p>Open <code>http://localhost:3000</code>, type a question, watch the answer stream with its sources. Without any search keys you still get a working demo: DuckDuckGo answers the grounding step, and answers synthesize from the web with citations.</p>
        <p>Requires Node.js 20 or newer. The dev server is for local work; production runs the edge build on Vercel.</p>
      </LegalSection>

      <LegalSection id="deploy" index={2} total={TOC.length} tone="neutral" title="Deploy to Vercel" summary="Fork, import, set environment variables, ship.">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Fork <code>archduke1337/SeekEngine</code> into your account.</li>
          <li>Import the fork in Vercel; keep the defaults — the app is already on the edge runtime.</li>
          <li>Set <code>OPENROUTER_API_KEY</code> at minimum. Add search keys to unlock the full retrieval fan-out.</li>
          <li>For a fleet of instances, set <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code> (free tier is enough).</li>
        </ol>
        <p>Using Layerbase as the fallback cache instead? <code>.github/workflows/redis-warm.yml</code> pings it every 10 minutes over TLS+SNI so it never sleeps. Configure the <code>LAYERBASE_REDIS_URL</code> repository secret and the workflow does the rest.</p>
      </LegalSection>

      <LegalSection id="configuration" index={3} total={TOC.length} tone="neutral" title="Configuration" summary="All environment variables, grouped by job.">
        <p><strong>Minimum for a working demo</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li><code>OPENROUTER_API_KEY</code> (or a pool via <code>OPENROUTER_API_KEYS</code>) — answers.</li>
        </ul>
        <p><strong>Answer providers</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li><code>OLLAMA_API_KEY</code>, <code>OLLAMA_MODEL</code> (default <code>beam:cloud</code>), <code>OLLAMA_BASE_URL</code> — second-choice provider.</li>
        </ul>
        <p><strong>Search grounding</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li><code>SERPAPI_KEY</code> — Google results via SerpAPI.</li>
          <li><code>GOOGLE_SEARCH_API_KEY</code> + <code>GOOGLE_SEARCH_CX</code> — direct Google Custom Search.</li>
          <li><code>EXA_API_KEY</code> — neural search; leads the merged order (the OSINT path).</li>
          <li>DuckDuckGo needs no key. It is always in the fan-out.</li>
        </ul>
        <p><strong>Caching &amp; rate limiting</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li><code>UPSTASH_REDIS_REST_URL</code> + <code>UPSTASH_REDIS_REST_TOKEN</code> — primary shared Redis (REST, edge-safe).</li>
          <li><code>LAYERBASE_REDIS_REST_URL</code> + <code>LAYERBASE_REDIS_REST_TOKEN</code> — optional fallback, written best-effort alongside the primary.</li>
        </ul>
        <p><strong>Operational secrets</strong></p>
        <ul className="list-disc space-y-1 pl-5">
          <li><code>CRON_SECRET</code> — Bearer for <code>/api/cron/redis-warm</code>.</li>
          <li><code>CACHE_STATS_SECRET</code> or <code>ADMIN_SECRET</code> — Bearer for <code>/api/ai/cache/stats</code>.</li>
        </ul>
        <p>The full, annotated list lives in <code>.env.example</code> in the repository root.</p>
      </LegalSection>

      <LegalSection id="project-layout" index={4} total={TOC.length} tone="neutral" title="Project layout" summary="Where everything lives.">
        <ul className="list-disc space-y-1 pl-5 font-mono text-[12px]">
          <li>src/app — routes: /, /results, /about, /privacy, /tos, /docs, /api, /developer, /compliance, /legal</li>
          <li>src/app/api — edge routes: search, ai/stream, ai/suggest, ai/cache/stats, cron/redis-warm</li>
          <li>src/components — search UI, layout, footer, shared bits, ui primitives</li>
          <li>src/lib — search fan-out, semantic cache, rate limiting, redis, fallback synthesis</li>
          <li>src/lib/openrouter — model registry, key pool, streaming engine, fallback chain</li>
          <li>src/hooks — streaming answer consumer, search history, debounce, location</li>
          <li>.github/workflows/redis-warm.yml — Layerbase keep-warm pinger</li>
        </ul>
        <p>Design tokens live in <code>src/globals.css</code>; the monochrome direction is deliberate — no border soup, ambient shadows, Instrument Serif for display type.</p>
      </LegalSection>

      <LegalSection id="troubleshooting" index={5} total={TOC.length} tone="neutral" title="Troubleshooting" summary="The failures we actually see.">
        <p><strong>Answers are generic or ignore sources.</strong> No search keys configured — retrieval fell through to DuckDuckGo only, or everything failed. Check logs for the provider fan-out; add at least one search key.</p>
        <p><strong>429 responses.</strong> Rate limits are per IP: 30/min for search, 20/min for the answer stream, 60/min for suggestions. Check <code>Retry-After</code>.</p>
        <p><strong>/api/ai/cache/stats returns 401.</strong> The Bearer token must match <code>CACHE_STATS_SECRET</code> (or <code>ADMIN_SECRET</code>). A mismatched or absent secret returns 500 <code>SERVER_MISCONFIGURED</code>, not 401 — check the server logs first.</p>
        <p><strong>Layerbase keeps sleeping.</strong> The warm workflow must be on the default branch to run on schedule, and <code>LAYERBASE_REDIS_URL</code> must be set as a repository secret. Manual trigger: Actions → Keep Redis warm → Run workflow; expect <code>PONG</code>.</p>
        <p><strong>Answers arrive when they should not.</strong> They cannot: the answer stream only starts after the grounding set is ready, and if retrieval fails or returns nothing, no answer is generated at all.</p>
      </LegalSection>
    </LegalPageShell>
  )
}
