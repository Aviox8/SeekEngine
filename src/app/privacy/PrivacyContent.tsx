'use client'

import Link from 'next/link'
import LegalPageShell, { LegalSection } from '../../components/ui/legal-page-shell'

const TOC = [
  { id: 'open-source', label: 'Open source', summary: 'MIT-licensed. Audit or self-host.' },
  { id: 'what-we-collect', label: 'What we collect', summary: 'The minimum needed to operate the demo.' },
  { id: 'why-we-collect-it', label: 'Why we collect it', summary: 'Research into grounding. Nothing else.' },
  { id: 'retention', label: 'Retention & deletion', summary: '90 days max. Then it is gone.' },
  { id: 'third-parties', label: 'Third-party services', summary: 'Google CSE and OpenRouter. Nothing else.' },
  { id: 'security', label: 'Security', summary: 'HTTPS, server-side keys, basic hygiene.' },
  { id: 'your-rights', label: 'Your rights', summary: 'You can ask. You can self-host. You can leave.' },
  { id: 'regulations', label: 'GDPR & regulations', summary: 'Minimal data = minimal compliance burden.' },
  { id: 'analytics', label: 'Analytics & observability', summary: 'Aggregate only. Never per-user.' },
  { id: 'changes', label: 'Changes to this policy', summary: 'We update this page and the GitHub repo.' },
  { id: 'self-hosting', label: 'Self-hosting', summary: 'The real privacy guarantee.' },
  { id: 'contact', label: 'Contact', summary: 'GitHub issues. Email for abuse.' },
]

const COLLECT_TABLE = [
  { kind: 'Query text', retention: '~3 hours', purpose: 'Pattern detection' },
  { kind: 'IP address (hashed)', retention: '24 hours', purpose: 'Rate-limit enforcement' },
  { kind: 'Response timestamps', retention: '90 days', purpose: 'Latency debugging' },
  { kind: 'Success / failure rates', retention: '90 days', purpose: 'Reliability monitoring' },
]

const DONT_COLLECT = [
  'User accounts or profiles',
  'Persistent cookies or session tokens',
  'Browser fingerprinting or device IDs',
  'Cross-site tracking pixels',
  'Advertising identifiers',
  'Per-user behaviour histories',
  'Email addresses (except for inbound abuse reports)',
  'Anything sold, licensed, or shared with third parties',
]

export default function PrivacyContent() {
  return (
    <LegalPageShell
      accent="privacy"
      badge="Open source"
      badgeMeta="Self-hostable · MIT"
      title="Privacy policy"
      intro="SeekEngine is open source. That means the code is public, the data practices are visible, and you have full control. This page covers the public demo. If you run your own instance, you decide the rules."
      toc={TOC}
      lastUpdated="2026-01-15"
      tldr={
        <div className="rounded-2xl border border-purple-200/60 dark:border-purple-800/40 bg-purple-50/60 dark:bg-purple-900/[0.07] p-5 sm:p-6 space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-700 dark:text-purple-300 mb-2">
              The short version
            </p>
            <p className="text-[15px] sm:text-base font-medium text-foreground/85 leading-relaxed">
              We collect the minimum data needed to operate the public demo, retain it for at most 90 days, never sell or share it, and publish every line of code so you can verify any of the above yourself. If you want stronger guarantees, run the project on your own hardware with your own API keys.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50 mb-2.5">
                We do collect
              </p>
              <ul className="space-y-1.5 text-[12.5px] text-foreground/70">
                {COLLECT_TABLE.map((row) => (
                  <li key={row.kind} className="grid grid-cols-[1fr_auto] gap-x-2 items-baseline">
                    <span className="font-medium text-foreground/85">{row.kind}</span>
                    <span className="text-foreground/35 tabular-nums text-[11px]">{row.retention}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50 mb-2.5">
                We do not collect
              </p>
              <ul className="space-y-1.5 text-[12.5px] text-foreground/70">
                {DONT_COLLECT.map((item) => (
                  <li key={item} className="flex items-baseline gap-2">
                    <span className="text-purple-500 mt-1 shrink-0">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" d="M3 6.5l2 2 4-5" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      }
      closing={
        <>
          <div className="rounded-2xl border border-purple-200/60 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-900/[0.05] p-5 sm:p-6 space-y-2">
            <p className="text-sm font-semibold text-foreground/85">
              The open-source advantage
            </p>
            <p className="text-prose-tight">
              You do not have to trust a company&apos;s privacy promises. You can audit the code yourself, run it on your own hardware, and modify it. That is the entire point of open source. Your data, your rules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-foreground/55">
            <span>Related:</span>
            <Link href="/tos" className="text-purple-600 dark:text-purple-400 hover:underline focus-visible:underline font-medium">
              Terms of service
            </Link>
            <span className="text-foreground/25">·</span>
            <Link href="https://github.com/archduke1337/SeekEngine" target="_blank" className="text-purple-600 dark:text-purple-400 hover:underline focus-visible:underline font-medium">
              GitHub repository
            </Link>
            <span className="text-foreground/25">·</span>
            <Link href="/about" className="text-purple-600 dark:text-purple-400 hover:underline focus-visible:underline font-medium">
              About the project
            </Link>
          </div>
        </>
      }
    >
      <LegalSection id="open-source" index={0} total={TOC.length} tone="purple" title="This is an open-source project" summary="MIT-licensed. The code is public, the deployment is auditable, and you can run your own copy with different policies entirely.">
        <p>
          SeekEngine is released under the MIT License. The code is public and auditable on GitHub. If you run your own instance, you have complete control over data collection and retention. This privacy policy describes the public demo at <code className="px-1.5 py-0.5 rounded bg-foreground/[0.05] text-[13px] font-mono">seekengine.vercel.app</code>. Your own deployment can have different policies entirely.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" index={1} total={TOC.length} tone="purple" title="What data we collect (public demo)" summary="Just enough to know whether the system is working.">
        <p>
          The public demo collects minimal data: query text (held for ~3 hours for pattern detection), hashed IP addresses (not persistently stored), response timestamps and latency, and aggregate success / failure rates of searches. We do not track individual users. We do not use cookies. We do not fingerprint browsers.
        </p>
        <p>
          In short: we log just enough to understand if the system is working, and nothing more.
        </p>
      </LegalSection>

      <LegalSection id="why-we-collect-it" index={2} total={TOC.length} tone="purple" title="Why we collect this data" summary="One purpose: research into grounding and retrieval-augmented generation.">
        <p>
          We need to understand how often queries return no results (a signal of verification failure), how response times vary (the latency cost of the grounding process), which types of queries succeed versus fail, and overall system error rates. This information is used to improve the grounding algorithm. It is never used for marketing, profiling, or commercial purposes.
        </p>
      </LegalSection>

      <LegalSection id="retention" index={3} total={TOC.length} tone="purple" title="Data retention and deletion" summary="90 days maximum. Then it is gone.">
        <p>
          Query logs are retained for 90 days, then automatically deleted. IP-address hashes are purged after 24 hours. Error traces are kept for 30 days. After these periods, the data is gone. We do not maintain long-term user profiles or history.
        </p>
        <p>
          If you are concerned about specific queries, run SeekEngine locally where you control retention directly.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" index={4} total={TOC.length} tone="purple" title="Third-party data sharing" summary="We share nothing. The demo does use two external services, though.">
        <p>
          We do not sell or share user data with anyone. However, the public demo does use external APIs as part of its normal operation:
        </p>
        <ul className="space-y-2 mt-3">
          <li className="pl-4 border-l-2 border-purple-500/30">
            <span className="font-semibold text-foreground/85">Google Custom Search</span>: receives your search query, used to retrieve sources.
          </li>
          <li className="pl-4 border-l-2 border-purple-500/30">
            <span className="font-semibold text-foreground/85">OpenRouter</span>: receives the retrieved context, used to synthesize an answer.
          </li>
        </ul>
        <p className="mt-3">
          Both are legitimate, privacy-respecting services, but you should review their policies. For sensitive queries, run SeekEngine on your own hardware with your own API keys.
        </p>
      </LegalSection>

      <LegalSection id="security" index={5} total={TOC.length} tone="purple" title="Security and data protection" summary="HTTPS, server-side keys, basic hygiene. Not a hardened production service.">
        <p>
          Data is transmitted over HTTPS. API keys live server-side and are never exposed to the client. Queries are not logged with personally identifiable information. We follow basic security hygiene: input validation, XSS protection, rate limiting, and an outbound request allowlist.
        </p>
        <p>
          However, we are a research project, not a hardened production service. For production use, audit the code yourself or run it locally.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" index={6} total={TOC.length} tone="purple" title="Your rights and control" summary="You can leave. You can self-host. You can ask. All three work.">
        <p>
          Since we do not build user profiles, there is little to retrieve or delete. But you have options: use the public demo anonymously (we do not track you), run SeekEngine locally for complete privacy, or fork the code and modify it however you want. Open source means you have agency. Use that.
        </p>
      </LegalSection>

      <LegalSection id="regulations" index={7} total={TOC.length} tone="purple" title="GDPR and privacy regulations" summary="Minimal data collection = minimal compliance burden.">
        <p>
          We operate under the principle that minimal data collection means minimal compliance burden. We do not build profiles, so GDPR&apos;s &ldquo;right to be forgotten&rdquo; is straightforward: there is nothing to forget. For EU residents, we comply with data-protection principles by design. If you use SeekEngine, you are in control of your data.
        </p>
      </LegalSection>

      <LegalSection id="analytics" index={8} total={TOC.length} tone="purple" title="Analytics and observability" summary="Aggregate only. Never per-user.">
        <p>
          We use aggregated analytics to monitor system health. The difference matters: &ldquo;90% of queries succeeded&rdquo; versus &ldquo;User @abc123 searched for X.&rdquo; We never do the latter. Observability is necessary for debugging, but it is done at the aggregate level. We do not track individual behaviour over time.
        </p>
      </LegalSection>

      <LegalSection id="changes" index={9} total={TOC.length} tone="purple" title="Changes to this policy" summary="If we change practices, this page and the GitHub repo get updated.">
        <p>
          If we change data practices, we will update this page and mention it in the GitHub repository. Continued use implies acceptance. But here is the thing: if you do not like our practices, you can fork the code and run your own version with different policies. That is the power of open source.
        </p>
      </LegalSection>

      <LegalSection id="self-hosting" index={10} total={TOC.length} tone="purple" title="Self-hosting and data sovereignty" summary="The strongest privacy guarantee is running it yourself.">
        <p>
          The best privacy guarantee: run SeekEngine on your own server. You control all data. You choose which APIs to use. You decide retention policies. The MIT license and the public repository make this the intended use case for any sensitive deployment.
        </p>
      </LegalSection>

      <LegalSection id="contact" index={11} total={TOC.length} tone="purple" title="Contact and transparency" summary="GitHub issues for questions. Email for abuse reports.">
        <p>
          Questions about privacy? Open an issue on GitHub. Want to audit the code? It is all there. Want to see what data we collect? Check the server logs in the implementation. Transparency is built in. We have nothing to hide because the project itself is auditable.
        </p>
        <p>
          Abuse reports on the public demo: <a href="mailto:gauravramyadav@gmail.com" className="text-purple-600 dark:text-purple-400 hover:underline focus-visible:underline font-medium">gauravramyadav@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPageShell>
  )
}
