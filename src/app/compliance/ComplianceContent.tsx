'use client'

import LegalPageShell, { LegalSection } from '../../components/ui/legal-page-shell'

const TOC = [
  { id: 'what-we-collect', label: 'What we collect', summary: 'Nothing personal. Aggregate counters only.' },
  { id: 'data-flows', label: 'Where your query goes', summary: 'The fan-out, the caches, the TTLs.' },
  { id: 'provider-handling', label: 'Provider data handling', summary: 'Each provider, honestly.' },
  { id: 'your-rights', label: 'Your rights', summary: 'GDPR and CCPA, applied sensibly.' },
  { id: 'security', label: 'Security and disclosure', summary: 'How to report a vulnerability.' },
  { id: 'certifications', label: 'Certifications', summary: 'None. The code is the audit.' },
]

export default function ComplianceContent() {
  return (
    <LegalPageShell
      accent="neutral"
      badge="Compliance"
      badgeMeta="Data handling"
      title="Compliance"
      intro="SeekEngine is built so that compliance is a property of the architecture, not a badge printed next to it. This page says exactly what leaves the server, who touches it, and for how long. with no aspirational language."
      lastUpdated="2026-11-05"
      toc={TOC}
    >
      <LegalSection id="what-we-collect" index={0} total={TOC.length} tone="neutral" title="What we collect" summary="No accounts, no profiles, no identity.">
        <p>SeekEngine has no accounts, no logins and no user database. Queries are not tied to any identity. there is no identity to tie them to. What exists at all:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>IP addresses</strong>. used only to enforce rate limits, held in memory or a short-TTL Redis window (60–120 seconds), never joined with query content, never logged.</li>
          <li><strong>Aggregated analytics</strong>. Vercel Analytics and Speed Insights measure page performance and traffic in aggregate (page views, web vitals). No per-user telemetry profiles, no cross-session tracking.</li>
          <li><strong>Server logs</strong>. operational diagnostics: provider used, latency, result counts, error codes. Aggregate, not per-user.</li>
        </ul>
      </LegalSection>

      <LegalSection id="data-flows" index={1} total={TOC.length} tone="neutral" title="Where your query goes" summary="Fan-out to providers, TTL-bound caches, then gone.">
        <p>Every search fans out in parallel to SerpAPI, Google Custom Search, Exa and a DuckDuckGo scrape. Those providers see your query. that is what they do. Nothing else in your request is sent.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Search context is cached for <strong>15 seconds</strong>, keyed by normalized query.</li>
          <li>Semantic answers are cached for <strong>30 minutes</strong>, keyed by normalized query. the content is everyone’s common answer, not yours.</li>
          <li>Query suggestions are cached for <strong>10 minutes</strong>.</li>
        </ul>
        <p>After streaming, your answer exists on your device. We do not store it, and the cache stores the generically-synthesized answer. the same answer anyone asking the same normalized question would get.</p>
        <p>Self-hosters control all of this: point the app at your own Redis (or run with no Redis at all) and the data lives and dies on your machine.</p>
      </LegalSection>

      <LegalSection id="provider-handling" index={2} total={TOC.length} tone="neutral" title="Provider data handling" summary="Each provider, and what it does with your query.">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>OpenRouter</strong>. routes to third-party models. Retention varies by the underlying provider; OpenRouter’s own policy applies to its routing layer. We configured nothing that opts you into training.</li>
          <li><strong>Ollama Cloud</strong>. serves <code>beam:cloud</code> by default, marketed as zero data retention. If Ollama changes that claim, the alternative is self-hosting or dropping the provider. the chain falls back gracefully.</li>
          <li><strong>Exa</strong>. neural retrieval; sees the query to return results. Its retention is governed by its own policy.</li>
          <li><strong>SerpAPI / Google Custom Search</strong>. Google Search infrastructure; sees the query. Governed by Google’s terms.</li>
          <li><strong>DuckDuckGo</strong>. scraped answers/results; sees the query, no account required.</li>
        </ul>
        <p>None of these receive anything besides the query text and, for the answer pipeline, the retrieved snippets. There is no payload, no metadata, no fingerprinting.</p>
      </LegalSection>

      <LegalSection id="your-rights" index={3} total={TOC.length} tone="neutral" title="Your rights" summary="GDPR and CCPA, applied honestly.">
        <p>Under the GDPR and CCPA you have rights to access, correct, delete and object to processing of your personal data. SeekEngine’s answer: there is no personal data store. Nothing is associated with a natural person, so there is nothing to export, correct or delete.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Deletion requests: there is nothing to delete. Queries are not retained against any identity.</li>
          <li>Portability: nothing to export.</li>
          <li>Objection: use the service anonymously, as designed. Self-host for complete control.</li>
          <li>Questions: open a GitHub issue or contact the maintainer via <a className="underline underline-offset-2 decoration-foreground/20 hover:decoration-foreground/60 focus-visible:decoration-foreground/60" href="https://archduke.is-a.dev" target="_blank" rel="noopener noreferrer">archduke.is-a.dev</a>.</li>
        </ul>
        <p>The hosted demo is a hobby project, not a data controller you can sue usefully. but the architecture that makes this easy is the same one that makes it honest.</p>
      </LegalSection>

      <LegalSection id="security" index={4} total={TOC.length} tone="neutral" title="Security and disclosure" summary="Report privately, fixed in the open.">
        <p>Found a vulnerability? Report it via GitHub Security Advisories on <code>archduke1337/SeekEngine</code>. There is no bug bounty. this is a solo project. but every report gets read, triaged and answered.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Secrets: none are in the repository; all credentials are environment variables.</li>
          <li>Cache stats and the Redis warm endpoint are Bearer-guarded; the warm endpoint is inert beyond a PING.</li>
          <li>All public endpoints are rate-limited per IP; the limiter fails open by design.</li>
          <li>Dependencies are pinned; the lockfile is committed.</li>
        </ul>
        <p>Please do not test against the hosted demo in ways that degrade it for others. Self-host; break your own.</p>
      </LegalSection>

      <LegalSection id="certifications" index={5} total={TOC.length} tone="neutral" title="Certifications" summary="None. and here is why that is honest.">
        <p>SeekEngine holds no certifications of any kind: no SOC 2, no ISO 27001, no HIPAA, no GDPR seal. A solo project wearing badges would be cosplay, not compliance.</p>
        <p>What exists instead: a fully open codebase you can audit line by line, a design that minimizes data by default, and this page saying exactly what happens. If your use case requires contractual compliance. a hospital, a law firm, a bank. you do not need our word; you need to self-host and make your own attestation, or not use this.</p>
        <p>Nothing on this page is legal advice, and nothing on this page should be read as a warranty. It is a description of an architecture.</p>
      </LegalSection>
    </LegalPageShell>
  )
}
