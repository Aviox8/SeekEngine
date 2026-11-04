# Design Decisions

### 2026-11-04 — OpenRouter free router replaces hand-picked free-model list

**Status**: accepted

OpenRouter's `openrouter/free` router assigns a suitable free model per request, which made the 29-model static tier catalog and tier-aware racing redundant. `getModelsForTask` now returns `[openrouter/free]` (override with `OPENROUTER_MODEL`). The racing engine is kept for the multi-provider fallback chain. Alternatives considered:
- Keep racing 29 models — rejected: wasted free-tier quota on losing connections; OpenRouter already balances load.
- Drop racing entirely — rejected: still needed inside the OpenRouter path if a pinned `OPENROUTER_MODEL` is used.

### 2026-11-04 — Provider fallback chains for answers and search

**Status**: accepted

Answer chain: OpenRouter → Ollama Cloud → Exa Answer API → local synthesis from raw search context (deterministic, citation-linked, zero-key). Search chain: SerpAPI → Google CSE → Exa → DuckDuckGo HTML scrape (keyless last resort). A fallback only engages when a provider fails *before emitting tokens*; a mid-stream failure keeps the partial answer. Alternatives considered:
- Silent single-provider dependency — rejected: one 429/1015 key rotation outage blanked the product.
- Retry same provider N times — rejected: adds latency on the critical path; fail-over beats retry.

### 2026-11-04 — Shared semantic answer cache accepted with scope documented

**Status**: accepted

Answers are cached by normalized query + task prefix (30 min, 500 entries) across all users of an edge instance. Accepted for hit-rate; flagged in docs as not user-isolated and not freshness-guaranteed. Revisit with Upstash Redis if multi-user correctness is required.

### 2026-11-04 — CSP keeps 'unsafe-inline', drops 'unsafe-eval' outside dev

**Status**: accepted

Next.js inline bootstrap still requires 'unsafe-inline' for scripts until nonce wiring is added; 'unsafe-eval' is now emitted only when NODE_ENV === 'development' (React refresh). Full nonce CSP deferred.

### 2026-11-04 — B&W with violet aurora as the only color system

**Status**: accepted

The palette is intentionally monochrome; violet/indico exists exclusively inside the orb/aurora/"AI presence" moments at ≤14% opacity. Adding hues to category states (e.g. colored chips per tier) is rejected — tier badges stay neutral-tinted. Reason: Hick's law + single-accent budget; the product's differentiation is typography and restraint, not color.

### 2026-11-04 — Fluid viewport-height hero (100dvh) over 100vh

**Status**: accepted

Home and empty-results surfaces use `min-h-[100dvh]` so mobile browser chrome never clips the search bar. `100vh` rejected for the same reason as the responsive reference warns.
