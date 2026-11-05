# SeekEngine - Setup & Deployment Guide

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages:
- `next@16` - React framework with App Router
- `react@19` - UI library
- `typescript@5.9` - Type safety
- `tailwindcss@3.4` - Styling
- `next-themes` - Dark/light mode
- `framer-motion`, `gsap`, `lenis` - Animation and smooth scrolling
- `react-markdown` + `rehype-sanitize` - Markdown rendering (sanitized)
- `zod` - Environment and response validation

> Node.js >= 20 is required (see `.node-version`; 22.x recommended).

### 2. Configure Environment Variables

Copy the environment template and fill in your API keys:

```bash
cp .env.example .env.local
```

**Minimum required:** `OPENROUTER_API_KEY` (get a free key at [openrouter.ai](https://openrouter.ai)).

**Optional:** `SERPAPI_KEY`, `GOOGLE_SEARCH_API_KEY` + `GOOGLE_SEARCH_CX`, and `EXA_API_KEY` (neural primary). Providers fan out in parallel and merge; DuckDuckGo works keyless, so without any keys search leans on it.

See [.env.example](./.env.example) for every supported variable, including the `OPENROUTER_API_KEYS` key pool and the `CACHE_STATS_SECRET`/`ADMIN_SECRET` used by the `/api/ai/cache/stats` monitoring endpoint.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
seekengine/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, metadata, providers
│   │   ├── page.tsx                # Homepage (centered search)
│   │   ├── results/                # Results page (AI + web results)
│   │   ├── about/ | tos/ | privacy/ # Static/legal pages
│   │   └── api/
│   │       ├── search/route.ts     # Web search fan-out (SerpAPI, Google CSE, Exa, DuckDuckGo merged)
│   │       └── ai/
│   │           ├── stream/route.ts # Streaming AI answers (SSE, main feature)
│   │           ├── suggest/route.ts # AI search suggestions
│   │           └── cache/stats/route.ts # Cache monitoring (admin-only)
│   ├── components/
│   │   ├── search/                 # SearchBar, StreamingAnswer, ResultCard, Skeleton
│   │   ├── layout/                 # Navbar, Providers, ErrorBoundary, shortcuts
│   │   ├── ui/                     # Base UI components
│   │   └── shared/                 # Animated shared components
│   ├── hooks/
│   │   ├── useSearch.ts            # Search state + suggestions
│   │   ├── useStreamingAnswer.ts   # SSE consumer
│   │   ├── useSearchHistory.ts     # Local history persistence
│   │   └── useDebounce.ts          # Debounce hook
│   └── lib/
│       ├── constants.ts            # Shared magic numbers (single source of truth)
│       ├── openrouter/             # AI integration (client, streaming, models, key-pool)
│       ├── search-context.ts       # Provider fallback + result cache
│       ├── semantic-cache.ts       # AI answer cache
│       ├── rate-limit.ts           # Per-IP rate limiting
│       ├── sanitize.ts / validation.ts # Input safety
│       └── errors.ts / logger.ts   # Error envelopes + structured logging
├── scripts/
│   └── generate-og-image.mjs       # Regenerates public/og-image.png
├── __tests__/                      # Vitest suites (libs + rate limiter)
├── .env.example                    # Environment variable template
└── README.md                       # Overview & quick start
```

## Features Implemented

### ✅ Design & Theme
- Ultra-minimalist aesthetic with generous whitespace
- Full dark/light mode support (persisted via next-themes)
- Smooth transitions, page transitions, and reduced-motion/data respect

### ✅ Core Search Functionality
- **Homepage:** centered search bar with ghost-text predictions and example chips
- **Real-time suggestions:** AI-powered via OpenRouter with template fallback
- **Results page:** streaming AI answer (SSE) beside traditional web results
- **Time filters:** past hour / day / week / month / year

### ✅ AI & Search Integration
- **Free-model router:** answers stream from `openrouter/free` (override with `OPENROUTER_MODEL`); OpenRouter routes each request to a suitable free model
- **Semantic caching:** normalized queries return cached answers instantly
- **Key pool:** multiple `OPENROUTER_API_KEYS` with automatic cooldown rotation
- **Provider failover:** answers OpenRouter → Ollama Cloud → local synthesis; search parallel fan-out (SerpAPI, Google CSE, Exa primary, DuckDuckGo, merged). Result dedupe at every step

### ✅ Technical Standards
- Server components by default, client components only where needed
- Debounced typing for suggestions (300ms)
- Loading skeletons during data fetch
- Error envelopes with standardized codes; no secrets or details leaked in production
- Mobile-first responsive design
- Accessibility (ARIA labels, keyboard navigation, keyboard shortcut overlay via `?`)

## Usage Examples

### Basic Search
1. Go to homepage
2. Type a search query (AI suggestions appear as you type)
3. Press Enter or pick a suggestion
4. Watch the AI answer stream in next to the web results

### Follow-up Questions
1. After an answer completes, type a follow-up into the search bar
2. Results update with a fresh stream

## Customization

### Change Accent Color
Edit `src/globals.css` (HSL design tokens) — components reference the theme variables, not hard-coded colors.

### Adjust Suggestion Debounce
Edit `DEBOUNCE_MS` in `src/lib/constants.ts`.

### Regenerate the OG Image
```bash
node scripts/generate-og-image.mjs
```

## Performance Notes

- Search results: <500ms via direct provider calls (15s result cache)
- AI answer: first token typically <2-3s (router + streaming); cached answers ~0ms
- Suggestions: <1s, cached 10 minutes per edge instance
- Cache hits: ~50ms

## Troubleshooting

### "OPENROUTER_API_KEY missing" when searching
- Ensure `.env.local` exists with a single key (`OPENROUTER_API_KEY`) or a pool (`OPENROUTER_API_KEYS`)
- Restart `npm run dev` after editing `.env.local`

### Search returning no results
- Set `SERPAPI_KEY`, `GOOGLE_SEARCH_API_KEY` + `GOOGLE_SEARCH_CX`, and `EXA_API_KEY`
- Confirm you haven't hit the per-IP rate limit (30 req/min for search, 20 req/min for streaming)

### Suggestions not appearing
- Ensure the query has at least 1 character
- Check the dev server console for AI errors

### Dark mode not working
- Theme follows system + saved preference (persisted by next-themes)

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import the repository at [vercel.com](https://vercel.com)
3. Add environment variables in project settings (never in files)
4. Deploy — all API routes run on the Edge Runtime automatically

### Other Platforms
Build and run:
```bash
npm run build
npm start
```

## Security Notes

- ✅ All provider calls are server-side only; keys never reach the browser
- ✅ No `NEXT_PUBLIC_` prefix on secret variables
- ✅ Queries validated (length, charset) and sanitized before provider calls
- ✅ Per-IP rate limits on every API route
- ✅ User queries are not logged beyond truncated debug previews

## Support & Customization

- **Analytics:** Vercel Analytics and Speed Insights are already integrated
- **Persistent caching:** shared Redis is wired via `src/lib/redis.ts` — set `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (primary) and optionally `LAYERBASE_REDIS_REST_URL`/`LAYERBASE_REDIS_REST_TOKEN` (fallback, kept warm every 10 min by `.github/workflows/redis-warm.yml`)
- **Styling:** design tokens live in `src/globals.css` and `tailwind.config.js`

---

**Built with Next.js 16, TypeScript, Tailwind CSS, and OpenRouter AI**
