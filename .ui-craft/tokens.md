# Design Tokens

Source of truth: `src/globals.css` (HSL CSS variables, light + dark) and `tailwind.config.js`.

## Colors
- Background: `hsl(0 0% 98.5%)` light / `hsl(0 0% 2.5%)` dark
- Foreground: `hsl(0 0% 3.5%)` light / `hsl(0 0% 97%)` dark
- Primary: pure B&W — black button + white text on light, inverse on dark
- Neutral ramp: `--neutral-50 … --neutral-900` (stone scale, #fafaf9 → #1c1917)
- Muted foreground: `hsl(0 0% 45%)` light / `hsl(0 0% 55%)` dark — text-only use ≥ /40 opacity
- Destructive: `hsl(0 84% 60%)`; Success `hsl(142 76% 36%)`; Warning `hsl(38 92% 50%)`
- Aurora (AI presence only): indigo/violet gradient `#818cf8 → #a78bfa → #6366f1` at ≤14% opacity, blur 60–90px
- Accents per shader (gradients, not flat fills): rose #e11d48, amber #f59e0b, emerald #059669, sky #0284c7, violet #7c3aed

## Typography
- Body: Space Grotesk, fluid `clamp()` scale in globals.css (h1 clamp(1.75rem, 4vw+0.5rem, 3rem)), `letter-spacing: -0.012em`, line-height 1.6
- Display: Instrument Serif (regular + italic) for h1 query title, hero wordmark, `.font-display`
- Mono: JetBrains Mono for code and kbd
- Tracking: tight on display (-0.02em…-0.03em), normal on body

## Spacing
Tailwind default scale on a 4px grid. Bar/pill minimum height 44px; `.touch-ok` opts out.

## Radius
- Inputs/pills: 9999px (search bar is a full pill)
- Cards: rounded-2xl (16px) for sources, rounded-xl/2xl for synthesis panel
- Dropdowns/modals: rounded-2xl / rounded-3xl
- Kbd chips: rounded-md/lg (6–10px)

## Shadows
- `--shadow-xs … --shadow-xl` (light/dark aware); dropdowns use `--dropdown-shadow` (16px blur, 0.1 alpha) with inset highlight
- Layered: cards use xs + border, no flat heavy drops; hover raises to sm with translateY(-2px)

## Motion
- Entrance ease `[0.16, 1, 0.3, 1]`, hero/logo ease `[0.25, 0.1, 0.25, 1]`
- Durations ≤ 700ms; exits ≈ 75% of enters; stagger ≤ 30ms
- Only transform/opacity animated; blur only on ambient layers (orb, shaders)
- `MotionConfig reducedMotion="user"` + global reduced-motion CSS + lenis `syncTouch`
