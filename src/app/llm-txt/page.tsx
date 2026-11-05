import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'llms.txt | SeekEngine',
  description: 'Machine-readable site summary for AI crawlers and answer engines.',
}

const sections = [
  {
    id: 'about',
    title: 'About SeekEngine',
    summary: 'MIT-licensed AI search engine research project.',
    content: `
<p>SeekEngine is an open source AI search engine research project. It fans out queries across multiple search providers in parallel, merges and deduplicates results, and synthesizes grounded answers with citations — all while keeping every source one click away.</p>
<ul className="list-disc space-y-1 pl-5">
  <li>License: MIT</li>
  <li>Homepage: <code>https://seekengine.vercel.app</code></li>
  <li>Source: <code>https://github.com/archduke1337/SeekEngine</code></li>
  <li>Maintainer: <a href="https://archduke.is-a.dev" className="underline underline-offset-2 hover:text-foreground">archduke.is-a.dev</a></li>
</ul>
`
  },
  {
    id: 'pages',
    title: 'Public pages',
    summary: 'HTML pages AI agents can read and link to.',
    content: `
<table className="w-full text-left border-collapse mb-4 text-[13px] sm:text-sm">
  <thead>
    <tr className="border-b border-foreground/[0.08]">
      <th className="pb-2 text-foreground/40 font-medium text-[11px] uppercase tracking-wide">Path</th>
      <th className="pb-2 text-foreground/40 font-medium text-[11px] uppercase tracking-wide">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/</td>
      <td className="py-2">Homepage with search bar</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/results</td>
      <td className="py-2">Search results with AI synthesis and web sources</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/about</td>
      <td className="py-2">How it works / about</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/docs</td>
      <td className="py-2">Documentation and self-hosting guide</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/api</td>
      <td className="py-2">API reference</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/developer</td>
      <td className="py-2">Developer information and contributing</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/legal</td>
      <td className="py-2">Legal index</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/compliance</td>
      <td className="py-2">Data &amp; compliance</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/privacy</td>
      <td className="py-2">Privacy policy</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/tos</td>
      <td className="py-2">Terms of service</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/robots</td>
      <td className="py-2">Crawler control documentation</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/llm-txt</td>
      <td className="py-2">This page</td>
    </tr>
  </tbody>
</table>
`
  },
  {
    id: 'api',
    title: 'API endpoints',
    summary: 'Programmatic access to search and answer generation.',
    content: `
<table className="w-full text-left border-collapse mb-4 text-[13px] sm:text-sm">
  <thead>
    <tr className="border-b border-foreground/[0.08]">
      <th className="pb-2 text-foreground/40 font-medium text-[11px] uppercase tracking-wide">Endpoint</th>
      <th className="pb-2 text-foreground/40 font-medium text-[11px] uppercase tracking-wide">Method</th>
      <th className="pb-2 text-foreground/40 font-medium text-[11px] uppercase tracking-wide">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/api/search</td>
      <td className="py-2">GET</td>
      <td className="py-2">Merged web search results</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/api/ai/stream</td>
      <td className="py-2">POST</td>
      <td className="py-2">Streamed grounded answer (SSE)</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/api/ai/suggest</td>
      <td className="py-2">GET</td>
      <td className="py-2">Query suggestions</td>
    </tr>
    <tr className="border-b border-foreground/[0.04]">
      <td className="py-2 font-mono text-[11px]">/api/ai/cache/stats</td>
      <td className="py-2">GET</td>
      <td className="py-2">Cache telemetry (Bearer-auth)</td>
    </tr>
  </tbody>
</table>
`
  },
  {
    id: 'crawl',
    title: 'Crawl control',
    summary: 'robots.txt and sitemap for crawlers.',
    content: `
<ul className="list-disc space-y-1 pl-5">
  <li><code>/robots.txt</code> — crawler rules; allows public pages, disallows <code>/api/</code> and <code>/_next/</code></li>
  <li><code>/sitemap.xml</code> — XML sitemap of all public pages</li>
  <li><code>/robots</code> — HTML documentation of crawler control</li>
</ul>
`
  },
]

export default function LlmTxtPage() {
  return (
    <main className="relative min-h-screen bg-background pb-24 pt-24 sm:pt-28">
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-6">
        <header className="mb-12 space-y-5 border-b border-foreground/[0.07] pb-10 sm:mb-16 sm:pb-12">
          <span className="inline-block rounded-lg bg-foreground/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground/75">
            Machine-readable summary
          </span>
          <h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] leading-[0.98] tracking-[-0.025em] text-foreground">
            llms.txt
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-foreground/65 sm:text-base">
            A machine-readable summary of SeekEngine for AI crawlers, answer engines, and agents.
            The plain-text file is served at <code>/llms.txt</code>.
          </p>
        </header>

        <section className="space-y-8 sm:space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
              <h2 id={`${section.id}-title`} className="text-lg sm:text-xl font-semibold tracking-tight text-foreground mb-2">
                {section.title}
              </h2>
              <p className="text-[13px] sm:text-sm font-medium text-foreground/50 mb-3 leading-relaxed">
                {section.summary}
              </p>
              <div className="text-prose-tight">{section.content}</div>
            </section>
          ))}
        </section>
      </div>
    </main>
  )
}
