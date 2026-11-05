import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Robots.txt & Crawler Control | SeekEngine',
  description: 'SeekEngine robots.txt rules, meta robots directives, and how search engines crawl the site.',
}

const sections = [
  {
    id: 'robots-txt',
    title: 'robots.txt',
    summary: 'The robots.txt file at the root of the site tells crawlers which paths may be fetched.',
    content: `
<p>The public <code>/robots.txt</code> governs crawler access across the whole site.</p>
<pre className="overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Sitemap: https://seekengine.vercel.app/sitemap.xml</pre>
<ul className="list-disc space-y-1 pl-5">
  <li><strong>Allowed:</strong> everything public (<code>/</code>, <code>/about</code>, <code>/results</code>, <code>/docs</code>, etc.)</li>
  <li><strong>Disallowed:</strong> internal API routes (<code>/api/*</code>) and Next.js internals (<code>/_next/*</code>)</li>
</ul>
`
  },
  {
    id: 'meta-robots',
    title: 'Meta robots tags',
    summary: 'Per-page indexing and following instructions served in HTML head.',
    content: `
<p>Every page declares its own crawl behavior through <code>&lt;meta name="robots"&gt;</code>:</p>
<pre className="overflow-x-auto rounded-xl bg-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed text-foreground/80">&lt;meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" /&gt;</pre>
<ul className="list-disc space-y-1 pl-5">
  <li><code>index</code> — the page may appear in search results</li>
  <li><code>follow</code> — links on the page may be followed by crawlers</li>
  <li><code>max-snippet:-1</code> — no limit on snippet length</li>
  <li><code>max-image-preview:large</code> — large image previews allowed</li>
</ul>
<p>API routes and internal paths are not indexed; they are excluded at the <code>/robots.txt</code> level and return JSON rather than HTML.</p>
`
  },
  {
    id: 'sitemap',
    title: 'Sitemap',
    summary: 'The XML sitemap lists every public page for search engine discovery.',
    content: `
<p><code>/sitemap.xml</code> is generated at build time and registered in <code>/robots.txt</code>. It covers:</p>
<ul className="list-disc space-y-1 pl-5">
  <li><code>/</code> — homepage</li>
  <li><code>/results</code> — search results page</li>
  <li><code>/about</code> — about / how it works</li>
  <li><code>/docs</code> — documentation</li>
  <li><code>/api</code> — API reference</li>
  <li><code>/developer</code> — developer information</li>
  <li><code>/legal</code> — legal index</li>
  <li><code>/compliance</code> — data &amp; compliance</li>
  <li><code>/privacy</code> — privacy policy</li>
  <li><code>/tos</code> — terms of service</li>
</ul>
`
  },
]

export default function RobotsPage() {
  return (
    <main className="relative min-h-screen bg-background pb-24 pt-24 sm:pt-28">
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-6">
        <header className="mb-12 space-y-5 border-b border-foreground/[0.07] pb-10 sm:mb-16 sm:pb-12">
          <span className="inline-block rounded-lg bg-foreground/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground/75">
            Crawler control
          </span>
          <h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] leading-[0.98] tracking-[-0.025em] text-foreground">
            Robots.txt &amp; meta robots
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-foreground/65 sm:text-base">
            How SeekEngine controls what search engines and AI crawlers can fetch, index, and follow —
            plus the exact rules served at <code>/robots.txt</code>.
          </p>
        </header>

        <section className="space-y-8 sm:space-y-10">
          {sections.map((section, i) => (
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
