# Project Brief

## Design Intent
A high-fidelity industrial AI search interface. Monochrome, confident, quiet. It should feel like a precision instrument — not a chatbot toy, not a marketing page. Black/white only; light is the only "AI presence" effect (monochrome aurora/glow), everything else restrained.

## Audience
Curious, technically-competent searchers on desktop and mobile. They want a fast answer with sources they can verify, not a feed. They tolerate dense type over decoration.

## Voice and Tone
Direct, honest, literal. Status copy names the actual step ("Retrieving sources", "Synthesizing answer") — never anthropomorphic ("thinking…" is banned except as a state label). Errors explain the root cause and what to do next. No marketing fluff. No exclamation marks.

## Constraints
- Monochrome B&W is the brand. Do not introduce any hue — violet/indigo aurora was removed from the product entirely (2026-11-04); AI presence is expressed through light and shade only.
- Instrument Serif is reserved for display type (h1 hero, query title, logo wordmark). Space Grotesk for body. JetBrains Mono for code/kbd only.
- Every animation must respect prefers-reduced-motion. Marquee/canvas effects are opt-out (skip-link + DynamicCanvasCrowd reduced-motion branch).
- Copy is sentence case. Uppercase only for 10–11px category labels with wide tracking.
- No secrets in client code. No animations on keyboard actions.
