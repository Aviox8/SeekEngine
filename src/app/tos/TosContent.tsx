'use client'

import Link from 'next/link'
import LegalPageShell, { LegalSection } from '../../components/ui/legal-page-shell'

const TOC = [
  { id: 'what-this-is', label: 'What this is', summary: 'An MIT-licensed research project.' },
  { id: 'mit-license', label: 'MIT license', summary: 'Use, modify, redistribute. As is.' },
  { id: 'disclaimer', label: 'Research disclaimer', summary: 'A demo, not a production search engine.' },
  { id: 'third-parties', label: 'Third-party services', summary: 'Google CSE and OpenRouter. Their terms apply.' },
  { id: 'data-collection', label: 'Data collection', summary: 'See the Privacy Policy for the full picture.' },
  { id: 'no-warranty', label: 'No hallucination warranty', summary: 'Grounding can fail. Verify independently.' },
  { id: 'acceptable-use', label: 'Acceptable use', summary: 'No spam, no abuse, no jailbreaks.' },
  { id: 'limitations', label: 'Limitations', summary: 'Latency, rate limits, English focus.' },
  { id: 'contributing', label: 'Contributing', summary: 'PRs welcome. MIT terms.' },
  { id: 'contact', label: 'Contact', summary: 'GitHub issues, or email for abuse.' },
]

const QUICK_FACTS = [
  { fact: 'License', value: 'MIT — use, modify, redistribute freely.' },
  { fact: 'Warranty', value: 'None. Provided as is. Verify important results.' },
  { fact: 'Uptime', value: 'Best-effort. The demo may be throttled or down.' },
  { fact: 'Data', value: 'Public demo logs anonymized queries. Self-host to opt out.' },
]

const DONT = [
  'Generate spam, abuse, or malicious content',
  'Bypass rate limits through automation',
  'Attack our infrastructure or upstream providers',
  'Run prompt-injection or jailbreak experiments',
  'Reverse-engineer or scrape the deployment',
]

export default function TosContent() {
  return (
    <LegalPageShell
      accent="tos"
      badge="Open source"
      badgeMeta="MIT License"
      title="Terms of service"
      intro="These are the terms for using the public demo. The whole project is MIT-licensed — what is below mostly explains the boundary between &ldquo;the code&rdquo; and &ldquo;the hosted demo.&rdquo;"
      toc={TOC}
      lastUpdated="2026-01-15"
      tldr={
        <div className="rounded-2xl border border-blue-200/60 dark:border-blue-800/40 bg-blue-50/60 dark:bg-blue-900/[0.07] p-5 sm:p-6 space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300 mb-2">
              The short version
            </p>
            <p className="text-[15px] sm:text-base font-medium text-foreground/85 leading-relaxed">
              The code is MIT-licensed and yours to fork, modify, and ship. The hosted demo is provided as is, with no uptime guarantee and no warranty that answers are correct. Be a reasonable user, do not attack the infrastructure, and verify anything important. That is the whole deal.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {QUICK_FACTS.map((row) => (
              <div key={row.fact} className="grid grid-cols-[5.5rem_1fr] gap-x-3 items-baseline">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/50">
                  {row.fact}
                </dt>
                <dd className="text-[12.5px] text-foreground/80 leading-snug">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      }
      closing={
        <>
          <p className="text-prose-tight">
            These terms were last updated in January 2026. For the complete license text, see the{' '}
            <Link
              href="https://github.com/archduke1337/SeekEngine/blob/main/LICENSE"
              target="_blank"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              LICENSE
            </Link>{' '}
            file on GitHub.
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-foreground/55">
            <span>Related:</span>
            <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Privacy policy
            </Link>
            <span className="text-foreground/25">·</span>
            <Link
              href="https://github.com/archduke1337/SeekEngine"
              target="_blank"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              GitHub repository
            </Link>
            <span className="text-foreground/25">·</span>
            <Link href="/about" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              About the project
            </Link>
          </div>
        </>
      }
    >
      <LegalSection id="what-this-is" index={0} total={TOC.length} tone="blue" title="What this is" summary="A research project, not a product. The public instance is a demo.">
        <p>
          SeekEngine is an open-source research project released under the MIT License. You can use it, modify it, and redistribute it freely. The public instance at <code className="px-1.5 py-0.5 rounded bg-foreground/[0.05] text-[13px] font-mono">seekengine.vercel.app</code> is provided as a demonstration. If you run your own instance, you control all data and policies for your deployment.
        </p>
      </LegalSection>

      <LegalSection id="mit-license" index={1} total={TOC.length} tone="blue" title="MIT license" summary="Use, modify, distribute. Include the copyright notice in redistributions.">
        <p>
          SeekEngine is distributed under the MIT License. In practice, that means:
        </p>
        <ul className="space-y-1.5 mt-3">
          <li>You can use, modify, and distribute the software freely.</li>
          <li>The software is provided &ldquo;as is&rdquo; without warranty.</li>
          <li>The authors are not liable for any issues arising from its use.</li>
          <li>You must include the copyright notice and license in any redistribution.</li>
        </ul>
        <p className="mt-3">
          See the LICENSE file in the repository for the complete legal text.
        </p>
      </LegalSection>

      <LegalSection id="disclaimer" index={2} total={TOC.length} tone="blue" title="Research disclaimer" summary="This is a research system, not a production search engine.">
        <p>
          SeekEngine is a research system designed to explore grounding and verify factual claims. It is not a production search engine. The public demo may:
        </p>
        <ul className="space-y-1.5 mt-3">
          <li>Return no results if queries cannot be verified.</li>
          <li>Have rate limits and availability constraints.</li>
          <li>Be modified or taken down without notice.</li>
          <li>Fail silently under heavy load.</li>
        </ul>
        <p className="mt-3">
          We prioritise accuracy over uptime. If you need reliable search, use established services.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" index={3} total={TOC.length} tone="blue" title="Third-party services" summary="Google CSE and OpenRouter. Their terms apply, not ours.">
        <p>
          The public demo uses Google Custom Search and OpenRouter APIs. These services have their own terms of service, which you implicitly agree to by using SeekEngine. We are not responsible for their availability, policies, or data practices. If you deploy SeekEngine yourself, you choose which backends to use.
        </p>
      </LegalSection>

      <LegalSection id="data-collection" index={4} total={TOC.length} tone="blue" title="Data collection (public demo)" summary="See the Privacy Policy for the full picture.">
        <p>
          The public instance logs anonymized query patterns for debugging and research, IP addresses (not stored persistently), response times, and error rates. We do not sell or share data. Logs are retained for 90 days and then deleted. If you run your own SeekEngine instance, you control all logging and data retention.
        </p>
        <p>
          Read the full <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Privacy Policy</Link> for the details.
        </p>
      </LegalSection>

      <LegalSection id="no-warranty" index={5} total={TOC.length} tone="blue" title="No hallucination warranty" summary="Grounding can fail silently. Verify independently.">
        <p>
          SeekEngine attempts to ground responses in retrieved facts, but this is not foolproof. Grounding can fail silently. Retrieved sources can be wrong. Models can misinterpret context. Use SeekEngine as a research tool, not as a source of truth. Always verify important information independently.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" index={6} total={TOC.length} tone="blue" title="Acceptable use" summary="Be a reasonable user. Do not attack the infrastructure.">
        <p>
          Do not use SeekEngine to:
        </p>
        <ul className="mt-3 space-y-1.5">
          {DONT.map((item) => (
            <li key={item} className="flex items-baseline gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3">
          Violations may result in access revocation from the public demo.
        </p>
      </LegalSection>

      <LegalSection id="limitations" index={7} total={TOC.length} tone="blue" title="Limitations" summary="Architectural tradeoffs, not bugs. The cost of grounding.">
        <p>
          SeekEngine has known limitations:
        </p>
        <ul className="space-y-1.5 mt-3">
          <li>English-language focus. Multilingual queries work but retrieval quality degrades outside English sources.</li>
          <li>Dependency on external APIs we do not control.</li>
          <li>Latency penalty for verification (~300 ms).</li>
          <li>Rate limits from upstream providers (Google CSE: 100/day for the public demo).</li>
          <li>No formal accuracy benchmarks. Research artifact, not a leaderboard entry.</li>
        </ul>
        <p className="mt-3">
          These are not bugs. They are architectural tradeoffs.
        </p>
      </LegalSection>

      <LegalSection id="contributing" index={8} total={TOC.length} tone="blue" title="Contributing" summary="PRs welcome. Submissions distributed under MIT.">
        <p>
          SeekEngine welcomes contributions. By submitting pull requests, you agree that your contributions can be distributed under the MIT License. See <code className="px-1.5 py-0.5 rounded bg-foreground/[0.05] text-[13px] font-mono">CONTRIBUTING.md</code> in the repository for guidelines.
        </p>
      </LegalSection>

      <LegalSection id="contact" index={9} total={TOC.length} tone="blue" title="Contact" summary="GitHub issues for questions. Email for abuse.">
        <p>
          For questions about these terms, the project, or the research behind it, open an issue on GitHub. For abuse reports on the public demo, email <a href="mailto:gauravramyadav@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">gauravramyadav@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPageShell>
  )
}
