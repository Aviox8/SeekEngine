'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: 'Grounded synthesis',
    desc: 'Every answer is built on retrieved sources, not the model\'s training data. If the web has nothing usable, the system tells you — it does not invent.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    title: 'Visible sources',
    desc: 'Sources sit beside the answer, ranked and deduplicated. Click any one. Verify any claim. The interface treats citation as a first-class feature, not a footnote.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    title: 'Inspectable by design',
    desc: 'A diagnostic terminal exposes the request trace: query, retrieval log, verification pass, model prompt, streamed tokens, and the final synthesis — all on one screen.',
  },
]

const researchPhases = [
  {
    title: 'Grounding the problem',
    desc: 'Every language model ships as a sealed container — trained on a frozen snapshot of the public web, with no native connection to anything new. The first experiment was to study exactly where this shows up. The conclusion was uncomfortable: a model that answers without retrieval is not broken, it is doing exactly what it was trained to do. The fix has to be structural, not parametric.',
  },
  {
    title: 'Retrieval as bootstrap',
    desc: 'Google Custom Search is not the most elegant retrieval engine, but it is public, predictable, well documented, and ships with a generous free tier. We use it as a bootstrap node — a reliable first stop for grounding. The choice is deliberate. The point of the project is not to compete with retrieval; it is to learn how to make retrieval and reasoning work together without one swallowing the other.',
  },
  {
    title: 'Parallel orchestration',
    desc: 'Search and inference are run in parallel. While the retriever fans out queries against the web, the language model is held in a waiting state, accumulating context rather than hallucinating. When both finish, results are fused: ranked sources, deduplicated text, normalized timestamps — and only then handed to the model for synthesis. Truth is not produced by either node alone. It is produced by their coordination.',
  },
  {
    title: 'Verification as protocol',
    desc: 'Grounded answers are not just sourced answers. Before any output reaches the user, it passes through a verification gate: the cited URL must resolve, the snippet must be consistent with the page, the freshness window must be respected, and source credibility has to clear a baseline. If any check fails, the answer is rewritten or refused outright. This is the part most retrieval demos skip. We treat it as non-negotiable.',
  },
  {
    title: 'Security and the adversarial surface',
    desc: 'Two boundaries need to be defended. The external boundary: the open web is adversarial. Pages lie, SEO farms game keywords, and click-bait content can drown out genuine sources. The internal boundary: even with perfect retrieval, the model can drift, paraphrase a source incorrectly, or invent intermediate steps that were never in the evidence. SeekEngine assumes zero trust at both surfaces and verifies continuously rather than only at the end.',
  },
  {
    title: 'Observability and diagnostics',
    desc: 'You cannot debug a distributed system with intuition. SeekEngine ships with a built-in diagnostic terminal that exposes the full request lifecycle: the original query, the retrieval trace, the verification log, the model prompt, the streamed tokens, and the final synthesis. Every step is visible. Observability is not just a debugging tool here; it is the only honest way to audit whether the system is actually being honest.',
  },
  {
    title: 'Partial failures and silent errors',
    desc: 'Real systems do not fail loudly. They fail quietly. Retrieval returns no useful results. The model finishes first and waits. A network blip drops one of ten sources. A query times out and the user sees a partial answer. SeekEngine is designed around the assumption that partial failure is the default state, and the interface is built to make silent degradation visible rather than paper over it.',
  },
  {
    title: 'What the system taught us',
    desc: 'After building and operating the system end to end, the most useful finding is conceptual. Hallucination is not a model problem; it is a coordination problem. Retrieval costs time, and time is the price of grounding. Truth, in a system like this, is not binary. It is distributed across sources, freshness, verification, and the synthesis step. A research prototype is the only honest way to find this out. Specs and benchmarks hide it.',
  },
]

const architecture = [
  { label: 'Framework', value: 'Next.js 16 · React 19 · App Router' },
  { label: 'Retrieval', value: 'Google Custom Search JSON API' },
  { label: 'Inference', value: 'OpenRouter (model-agnostic)' },
  { label: 'Streaming', value: 'Server-Sent Events, end-to-end' },
  { label: 'State', value: 'React Server Components + minimal client state' },
  { label: 'Hosting', value: 'Vercel Edge (public demo)' },
  { label: 'License', value: 'MIT — fork, modify, redeploy freely' },
]

const limitations = [
  { name: 'English-language focus', detail: 'Multilingual queries work but retrieval quality degrades outside English-language sources.' },
  { name: 'Verification latency', detail: 'Adds ~300 ms to total response time. A deliberate cost of grounding.' },
  { name: 'Rate limits', detail: 'Bounded by Google CSE (100/day) and OpenRouter (provider-dependent). The public demo may throttle under load.' },
  { name: 'No formal accuracy benchmarks', detail: 'Built as a research artifact, not a leaderboard entry. Qualitative evaluation only.' },
  { name: 'Adversarial inputs', detail: 'Prompt-injection in retrieved content is filtered but not eliminated. Treat the answer as a starting point.' },
  { name: 'No user accounts', detail: 'Search history is stored locally in your browser. There is no cross-device sync.' },
]

export default function AboutContent() {
  return (
    <main className="relative min-h-screen bg-background pt-20 pb-24 font-sans transition-colors duration-700 sm:pt-24 sm:pb-40">
      <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-6">

        {/* ── HERO ────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-12 sm:mb-16"
        >
          <div className="relative overflow-hidden rounded-md border border-foreground/[0.08] bg-black">
            <Image
              src="/images/about-hero.png"
              alt="SeekEngine — four curious observers framing the brand from every corner"
              width={1600}
              height={1200}
              priority
              className="w-full h-auto"
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-foreground/[0.04] text-foreground/55 text-[11px] font-medium border border-foreground/[0.06]">
              Open source · MIT
            </span>
            <span className="text-[11px] font-medium text-foreground/35 tracking-wide">
              Research prototype · v0.x
            </span>
          </div>
        </motion.section>

        {/* ── TITLE + SUMMARY ────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-14 sm:mb-16"
        >
          <h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] leading-[0.95] tracking-[-0.025em] text-foreground mb-6">
            A search engine that <span className="font-display-italic text-foreground/45">shows its work.</span>
          </h1>
          <div className="space-y-4 text-prose text-[15px] sm:text-base">
            <p>
              SeekEngine is a small, independent research project that rethinks how a search engine talks to a language model. Instead of letting a model answer questions from memory alone, the system retrieves fresh, verifiable context from the public web, runs it through a verification gate, and only then asks the model to synthesize an answer grounded in what was actually found.
            </p>
            <p className="text-foreground/55">
              The result is a search interface that behaves less like a chatbot and more like a careful researcher. It shows its sources, signals uncertainty, and refuses to invent. Built solo, on free-tier APIs, with the conviction that the next generation of search has to be auditable, not magical.
            </p>
          </div>
        </motion.section>

        {/* ── FEATURES ────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-20 sm:mb-24"
        >
          <div className="mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Three things, done deliberately.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                viewport={{ once: true, margin: '-80px' }}
                className="group relative rounded-2xl border border-foreground/[0.07] bg-foreground/[0.01] p-5 sm:p-6 transition-colors hover:border-foreground/15 hover:bg-foreground/[0.02]"
              >
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/[0.04] text-foreground/65 transition-colors group-hover:bg-foreground/[0.07] group-hover:text-foreground/85">
                  {feature.icon}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-prose-tight">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── THE PROBLEM ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-20 sm:mb-24"
        >
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Hallucination is a coordination problem.
            </h2>
          </div>
          <div className="space-y-4 text-prose">
            <p>
              Large language models are, at their core, sealed text generators. They have no native access to the live web, no built-in concept of a source, and no reliable way to tell the difference between a fact it has seen in training and a fact it is inventing on the fly. When they fail, the failure is silent and confident. The industry calls this hallucination.
            </p>
            <p>
              SeekEngine treats hallucination as a coordination problem, not a model problem. A model with no ground truth and no constraint is not broken; it is doing exactly what it was trained to do. The fix is structural: a system around the model that enforces what it can say, where it can say it from, and when it has to admit it does not know.
            </p>
          </div>
        </motion.section>

        {/* ── RESEARCH JOURNEY ────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20 sm:mb-24"
        >
          <div className="mb-3">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              The research journey
            </h2>
          </div>
          <p className="text-prose-tight mb-10 max-w-2xl">
            SeekEngine was built as a sequence of deliberate experiments. Each phase surfaced a real failure mode in the previous one, and the architecture grew around those failures. The log below is the actual order in which the system was reasoned into existence.
          </p>

          <div className="space-y-0">
            {researchPhases.map((phase, idx) => (
              <motion.article
                key={phase.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.04 }}
                viewport={{ once: true, margin: '-80px' }}
                className={`group relative grid grid-cols-1 gap-2 border-t border-foreground/[0.07] py-8 sm:py-10 ${
                  idx === researchPhases.length - 1 ? 'border-b' : ''
                }`}
              >
                <h3 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
                  {phase.title}
                </h3>
                <p className="text-prose-tight max-w-2xl">
                  {phase.desc}
                </p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* ── ARCHITECTURE ────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-20 sm:mb-24"
        >
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              The architecture, in one table.
            </h2>
          </div>

          <div className="rounded-2xl border border-foreground/[0.07] overflow-hidden">
            <dl className="divide-y divide-foreground/[0.07]">
              {architecture.map((row) => (
                <div key={row.label} className="grid grid-cols-1 gap-1 px-5 py-3.5 sm:grid-cols-[10rem_1fr] sm:gap-4 sm:px-6 sm:py-4">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/35">
                    {row.label}
                  </dt>
                  <dd className="text-[14px] sm:text-[15px] text-foreground/80 font-medium leading-relaxed">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </motion.section>

        {/* ── LIMITATIONS ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-20 sm:mb-24"
        >
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              What this is not, and what it can&apos;t do.
            </h2>
          </div>
          <p className="text-prose-tight mb-8 max-w-2xl">
            No demo is honest about its limits. Here are ours, in plain language. Some are architectural tradeoffs; others are simply the scope of a research prototype.
          </p>

          <ul className="space-y-0">
            {limitations.map((lim) => (
              <li key={lim.name} className="grid grid-cols-1 gap-1.5 border-t border-foreground/[0.07] py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                <span className="text-[13px] sm:text-sm font-semibold text-foreground/85">
                  {lim.name}
                </span>
                <span className="text-prose-tight">
                  {lim.detail}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* ── CLOSING ─────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-16 sm:mb-20"
        >
          <div className="space-y-4 text-prose">
            <p>
              SeekEngine is not a product. It is a research artifact. The goal is to make the cost of grounding visible, to make hallucination inspectable, and to keep the door open for anyone who wants to run, fork, or stress-test the ideas.
            </p>
            <p className="text-foreground/55">
              If something here interests you — the verification gate, the parallel orchestration, the observability model, or the limits — the code is public and the maintainer is reachable. Pull requests, critiques, and bug reports all welcome.
            </p>
          </div>
        </motion.section>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          viewport={{ once: true }}
          className="mt-12 space-y-10 border-t border-foreground/[0.06] pt-10 sm:mt-16 sm:pt-12"
        >
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/35 mb-3">
                Research & inquiries
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-foreground/45">Researcher:</span>{' '}
                  <span className="font-medium text-foreground">Gaurav Yadav</span>
                </p>
                <p className="text-sm">
                  <a
                    href="mailto:gauravramyadav@gmail.com"
                    className="text-foreground/65 hover:text-foreground focus-visible:text-foreground underline underline-offset-4 decoration-foreground/15 hover:decoration-foreground/30 transition-colors font-medium"
                  >
                    gauravramyadav@gmail.com
                  </a>
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/35 mb-3">
                Elsewhere
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Link href="https://github.com/archduke1337/SeekEngine" target="_blank" className="text-foreground/55 hover:text-foreground focus-visible:text-foreground transition-colors">
                  GitHub →
                </Link>
                <Link href="https://archduke.is-a.dev/research/seekengine" target="_blank" className="text-foreground/55 hover:text-foreground focus-visible:text-foreground transition-colors">
                  Research paper →
                </Link>
                <Link href="https://archduke.is-a.dev" target="_blank" className="text-foreground/55 hover:text-foreground focus-visible:text-foreground transition-colors">
                  Portfolio →
                </Link>
                <Link href="/tos" className="text-foreground/55 hover:text-foreground focus-visible:text-foreground transition-colors">
                  Terms →
                </Link>
                <Link href="/privacy" className="text-foreground/55 hover:text-foreground focus-visible:text-foreground transition-colors">
                  Privacy →
                </Link>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-foreground/30 tracking-wide">
            SeekEngine is a research project. Use it as a starting point for verification, not a substitute for it.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
