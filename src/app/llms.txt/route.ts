/**
 * llms.txt — machine-readable site summary for AI crawlers and answer engines.
 * Served as plain text at /llms.txt. Companion to the HTML page at /llm-txt.
 */

export const dynamic = 'force-dynamic'

export async function GET() {
  const text = `# SeekEngine
## Open source AI search engine research project

### Summary
SeekEngine is an MIT-licensed AI search engine research project. It fans out queries across multiple search providers in parallel, merges and deduplicates results, and synthesizes grounded answers with citations — all while keeping every source one click away.

License: MIT
Homepage: https://seekengine.vercel.app
Source: https://github.com/archduke1337/SeekEngine
Maintainer: https://archduke.is-a.dev

### Pages
- / - Homepage with search
- /results - Search results with AI synthesis and web sources
- /about - How it works / about
- /docs - Documentation and self-hosting guide
- /api - API reference
- /developer - Developer information and contributing
- /legal - Legal index
- /compliance - Data & compliance
- /privacy - Privacy policy
- /tos - Terms of service
- /robots - Crawler control documentation
- /llm-txt - This page (HTML rendering of this file)

### API
- GET /api/search?q=... - Merged web search results (30 req/min per IP)
- POST /api/ai/stream - Streamed grounded answer via SSE (20 req/min per IP)
- GET /api/ai/suggest?q=... - Query suggestions (60 req/min per IP)
- GET /api/ai/cache/stats - Cache telemetry, Bearer-auth (10 req/min per IP)

### Crawl
- /robots.txt - Crawler rules; allows public pages, disallows /api/ and /_next/
- /sitemap.xml - XML sitemap of all public pages

### Notes
All public pages include JSON-LD structured data and Open Graph tags.
The answer pipeline grounds responses in retrieved web context and cites every source.
`
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
