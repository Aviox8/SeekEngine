# SeekEngine

An AI-enhanced search engine with a minimalist design, dark/light mode support, and production-grade architecture.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

**Minimum Required**:
- `OPENROUTER_API_KEY` - Get free key from [OpenRouter](https://openrouter.ai)

**Optional (for web search)**:
- `SERPAPI_KEY` - For real-time Google search
- `GOOGLE_SEARCH_API_KEY` + `GOOGLE_SEARCH_CX` - Alternative search provider

See [.env.example](./.env.example) for detailed setup instructions.

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Features

- 🎨 **Ultra-minimalist design** with dark/light mode
- 🔍 **Real-time AI suggestions** powered by OpenRouter
- 📊 **AI-generated summaries** with traditional web results
- ⚡ **Sub-100ms response times** (Edge Runtime)  
- 📱 **Mobile-first responsive** layout
- ♿ **Accessible** (ARIA labels, keyboard navigation)
- 🔐 **Production-grade architecture** with:
  - Model racing for faster answers
  - Semantic caching for duplicate queries (per instance)
  - Rate limiting per IP
  - Input sanitization
  - Structured error handling
  - Comprehensive logging

## Documentation

- **[SETUP.md](./SETUP.md)** - Detailed installation, API key setup, and deployment guide
- **[.env.example](./.env.example)** - Environment setup guide

## Development

### Build & Deploy

```bash
npm run build      # Production build
npm start          # Run production server
npm run lint       # Check code quality
npm test           # Run test suite
npm test:watch     # Watch mode
node scripts/generate-og-image.mjs   # Regenerate public/og-image.png
```

### Project Structure

```
src/
├── app/
│   ├── page.tsx            # Home page
│   ├── results/            # Search results page
│   ├── api/
│   │   └── ai/
│   │       ├── stream/     # Streaming answers (main feature)
│   │       ├── suggest/    # AI suggestions
│   │       └── cache/      # Cache monitoring
│   └── api/search/         # Web search aggregation
├── components/
│   ├── search/             # Search UI components
│   ├── layout/             # Layout components
│   └── ui/                 # Base UI components
├── hooks/
│   ├── useSearch.ts        # Search state management
│   ├── useStreamingAnswer.ts # SSE consumer
│   └── useSearchHistory.ts # History persistence
└── lib/
    ├── constants.ts        # All magic numbers
    ├── errors.ts           # Error types & formatting
    ├── logger.ts           # Structured logging
    ├── sanitize.ts         # Input validation
    ├── openrouter/         # AI integration
    └── rate-limit.ts       # Rate limiting
```

## Architecture Highlights

### Model Racing
Simultaneously request answers from multiple AI models, streaming the first successful response (no waiting for slowest model). Losing connections immediately aborted to prevent token waste.

### Semantic Caching
Normalize queries to catch "What is AI?" vs "what IS artificial intelligence?" as the same question, returning cached answers instantly. Note: caches live in the edge instance's memory — each instance has its own, so hit rates follow instance traffic.

### Edge Runtime
All APIs run on Vercel Edge Runtime for <100ms cold starts, globally replicated, with per-IP rate limiting and automatic key failover.

## Tests

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Run specific file
npm test -- models
```

**Test Coverage**: 
- Rate limiting logic
- Model classification & naming
- Error handling
- Input sanitization
- Query validation

## Contributing

1. Follow TypeScript strict mode
2. Add tests for new features
3. Use standardized error handling (`Errors.*`)
4. Use structured logging (`logger.*`)
5. Add JSDoc comments to exports

## Performance

- **Search Results**: <500ms (SerpAPI direct)
- **AI Answer**: <2-3s (model racing + streaming)
- **Suggestions**: <1s (cached)
- **Cache Hits**: <50ms (instant)

## Security

- Input sanitization on all queries
- UTF-8 validation
- Rate limiting per IP
- No API keys in client code
- Structured error messages (no details leaked)

## License

MIT - See [LICENSE](./LICENSE) for details.

## Support

### Common Issues

**"OPENROUTER_API_KEY missing"**
- Create `.env.local` (see [.env.example](./.env.example))
- Get free key from [OpenRouter](https://openrouter.ai)
- Restart `npm run dev`

**Search returning no results**
- Set `SERPAPI_KEY` or Google Custom Search keys
- Or use fallback (less accurate)  
- Check that rate limit not exceeded

**Slow first query**
- First query has model racing lookup (~2s)
- Subsequent queries cached (~50ms)
- Model list cached (10 min TTL)

For environment setup see [.env.example](./.env.example); for deployment see [SETUP.md](./SETUP.md).

---

**Built with Next.js, React, TypeScript, Tailwind CSS, and OpenRouter AI.**
