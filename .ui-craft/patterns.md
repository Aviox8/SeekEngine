# Patterns

## Pattern: Answer Panel (Synthesis)

**Description**: The left-column AI answer surface: phase indicator (retrieve/verify/synthesize stepper), sources strip, streamed markdown answer, and a provenance badge (model, tier, latency, cache state). Server emits SSE events: thinking → sources → model_selected → token* → done.

**Usage**: `/results` page only (`StreamingAnswer.tsx` + `ui/response.tsx` + `ui/sources.tsx`). Reuse for any future "explain this query" surface.

**Constraints**: Never announce tokens via aria-live — the `role="status"` stepper announces phases; the answer itself is read when done. Always render provider/tier/latency honestly (fallbacks show "Local synthesis").

## Pattern: Search Pill

**Description**: Full-radius, borderless pill input with ghost-text prediction (Tab to accept), inline living icon / spinner while typing, inline clear button, and keyboard hint row when idle. No visible "form" chrome.

**Usage**: Home hero, `/results` empty state, `/results` follow-up box (compact variant).

**Constraints**: textarea, not input — up to 160px auto-grow; 16px font on mobile (iOS zoom trap); Enter = search, Shift+Enter = newline, Tab = accept prediction.

## Pattern: Ghost Prediction

**Description**: Dim suffix preview of the AI/next-query prediction, rendered in an overlay div behind the textarea, accepted via Tab.

**Usage**: SearchBar only.

**Constraints**: Overlay must be `aria-hidden`; never inject prediction text into the input value without Tab (or explicit click).

## Pattern: Citation Source Card

**Description**: Title (2-line clamp), favicon fallback glyph, source/host line, snippet (2-line clamp), external-link glyph on hover.

**Usage**: `/results` right column. Link is the whole card.

**Constraints**: `display:block` anchor, `target="_blank" rel="noopener noreferrer"`, `min-h-[44px]` via global touch-target rule, `initial opacity/translate` gated so reduced-motion users see no slide.

## Pattern: Kicker Row

**Description**: 11px uppercase, wide tracking, muted label with a small leading tick (`w-1 h-4 rounded-full bg-primary/40`).

**Usage**: Above major blocks — "Results", "Suggested follow-ups", panel section captions.

**Constraints**: Kickers are for category labels only, not body copy. Budget: one per panel.

## Pattern: Empty/Error State

**Description**: Dashed-border rounded panel, centered 40px icon disc, one-line cause, one-line remediation hint, retry button.

**Usage**: `/results` sources column error, no-results, and query-less state. Error variant uses `border-destructive/30` + retry.

**Constraints**: Never show the raw exception string. Always offer a next action (Retry / broaden query / clear time filter).
