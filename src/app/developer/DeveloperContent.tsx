'use client'

import LegalPageShell, { LegalSection } from '../../components/ui/legal-page-shell'

const TOC = [
  { id: 'the-project', label: 'The project', summary: 'What this is and why it exists.' },
  { id: 'the-stack', label: 'The stack', summary: 'Next.js, edge runtime, Redis, zero magic.' },
  { id: 'run-locally', label: 'Run it locally', summary: 'Clone, install, key, dev server.' },
  { id: 'contributing', label: 'Contributing', summary: 'Branches, commits, PRs, tests.' },
  { id: 'license', label: 'License and credits', summary: 'MIT. Built on public APIs and open work.' },
]

export default function DeveloperContent() {
  return (
    <LegalPageShell
      accent="neutral"
      badge="Developer"
      badgeMeta="Open source, MIT"
      title="Developer"
      intro="SeekEngine is a solo, open-source research project. There is no company behind it. the codebase is the product, the documentation is the marketing, and the audit you need to do on this project is reading the code."
      lastUpdated="2026-11-05"
      toc={TOC}
    >
      <LegalSection id="the-project" index={0} total={TOC.length} tone="neutral" title="The project" summary="An answer engine that shows its work, built to be read.">
        <p>SeekEngine exists to test one thesis: a model that never saw your question, answering from a frozen snapshot of someone else’s index, is the floor. not the ceiling. The interesting question is what happens around the model: fan-out retrieval, strict grounding, honest fallbacks, visible provenance.</p>
        <p>It is maintained by one person. <a className="underline underline-offset-2 decoration-foreground/20 hover:decoration-foreground/60 focus-visible:decoration-foreground/60" href="https://github.com/archduke1337" target="_blank" rel="noopener noreferrer">archduke1337</a>. Originally developed by <a className="underline underline-offset-2 decoration-foreground/20 hover:decoration-foreground/60 focus-visible:decoration-foreground/60" href="https://github.com/archduke1337" target="_blank" rel="noopener noreferrer">archduke1337</a>, now maintained by <a className="underline underline-offset-2 decoration-foreground/20 hover:decoration-foreground/60 focus-visible:decoration-foreground/60" href="https://github.com/Aviox8" target="_blank" rel="noopener noreferrer">Aviox8</a>. Bug reports are welcome; roadmaps are deliberately not published, because the project follows curiosity, not sprints.</p>
      </LegalSection>

      <LegalSection id="the-stack" index={1} total={TOC.length} tone="neutral" title="The stack" summary="Boring, typed, fast. and free to run.">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Next.js 15</strong> (App Router) and <strong>React 19</strong>, TypeScript end to end</li>
          <li><strong>Edge runtime</strong> for all API routes. low latency, no cold Node containers</li>
          <li><strong>Tailwind CSS</strong> + design tokens; <strong>Framer Motion</strong> for motion (gated on reduced-motion)</li>
          <li><strong>Upstash-compatible Redis</strong> (REST) for shared semantic caches and rate limiting; in-memory fallback</li>
          <li><strong>OpenRouter, Ollama Cloud, Exa, SerpAPI, Google CSE, DuckDuckGo</strong>. all swappable providers</li>
          <li><strong>Vitest</strong>. 105 tests; typecheck and tests are the merge gates, always</li>
          <li><strong>Vercel</strong>. hosting, Analytics (aggregate only) and Speed Insights</li>
        </ul>
        <p>The design system is deliberately constrained: monochrome, edgeless floating surfaces, ambient shadows, Instrument Serif for display type, one accent for nothing. Constraints age better than palettes.</p>
      </LegalSection>

      <LegalSection id="run-locally" index={2} total={TOC.length} tone="neutral" title="Run it locally" summary="Four commands and one API key.">
        <pre className="overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">{`git clone https://github.com/archduke1337/SeekEngine.git
cd SeekEngine
npm install
cp .env.example .env.local   # set OPENROUTER_API_KEY
npm run dev                  # http://localhost:3000`}</pre>
        <p>Contributions verify with <code>npm run typecheck</code> and <code>npm test</code>. Both pass on main; if they do not on yours, that is the first thing to fix.</p>
      </LegalSection>

      <LegalSection id="contributing" index={3} total={TOC.length} tone="neutral" title="Contributing" summary="Small diffs, clear commits, no ceremony.">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Fork <code>archduke1337/SeekEngine</code> and cut a branch off <code>main</code>.</li>
          <li>Keep diffs small and scoped; one concern per pull request.</li>
          <li>Commit messages: sentence-case imperative, no jargon. &ldquo;fix the retry loop on cold start&rdquo;, not &ldquo;fixes&rdquo;.</li>
          <li>UI work: monochrome, edgeless, sentence case, reduced-motion safe. Read <code>.ui-craft/decisions.md</code> before touching layout.</li>
          <li>Open the PR against upstream <code>main</code>. Expect review to ask for evidence, not opinions.</li>
        </ol>
        <p>Big changes. new providers, architectural shifts, new pages. start as an issue. Describe the failure first, the fix second.</p>
      </LegalSection>

      <LegalSection id="license" index={4} total={TOC.length} tone="neutral" title="License and credits" summary="MIT. Everything public, everything auditable.">
        <p>SeekEngine is MIT-licensed; see <code>LICENSE</code>. Copyright 2025 Archduke1337. Do what you want, keep the notice.</p>
        <p>Built on public work: OpenRouter and Ollama Cloud (inference), SerpAPI, Google Custom Search, Exa and DuckDuckGo (retrieval), Anthropic’s open model ecosystem via OpenRouter’s free tier, Instrument Serif (typography), Vercel (platform), and the open-source ideas of Perplexity, DuckDuckGo Instant Answers, and every search engine that refused to be a black box.</p>
        <p>Inspired by the Vercel and ElevenLabs AI design languages. restrained, modern, provenance-forward.</p>
      </LegalSection>
    </LegalPageShell>
  )
}
