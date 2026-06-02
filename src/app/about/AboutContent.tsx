'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

const researchPhases = [
  {
    num: '01',
    title: 'Grounding the Problem',
    desc: 'Every language model ships as a sealed container. It was trained on a frozen snapshot of the public web and released into the world, with no native connection to anything new. The first phase of the project was to study exactly where this shows up. The conclusion was uncomfortable: a model that answers without retrieval is not broken, it is doing exactly what it was trained to do. The fix has to be structural, not parametric.',
  },
  {
    num: '02',
    title: 'Retrieval as Bootstrap',
    desc: 'Google Custom Search is not the most elegant retrieval engine, but it is public, predictable, well documented, and ships with a generous free tier. We use it as a bootstrap node — a reliable first stop for grounding context. The choice is deliberate. The point of the project is not to compete with retrieval; it is to learn how to make retrieval and reasoning work together without one swallowing the other.',
  },
  {
    num: '03',
    title: 'Parallel Orchestration',
    desc: 'Search and inference are run in parallel. While the retriever fans out queries against the web, the language model is held in a waiting state, accumulating context rather than hallucinating. When both finish, the results are fused: ranked sources, deduplicated text, normalized timestamps, and only then handed to the model for synthesis. Truth is not produced by either node alone. It is produced by their coordination.',
  },
  {
    num: '04',
    title: 'Verification as Protocol',
    desc: 'Grounded answers are not just sourced answers. Before any output reaches the user, it passes through a verification gate: the cited URL must resolve, the snippet must be consistent with the page, the freshness window must be respected, and the source credibility has to clear a baseline. If any check fails, the answer is rewritten or refused outright. This is the part most retrieval demos skip. We treat it as non-negotiable.',
  },
  {
    num: '05',
    title: 'Security and the Adversarial Surface',
    desc: 'Two boundaries need to be defended. The external boundary: the open web is adversarial. Pages lie, SEO farms game keywords, and click-bait-tuned content can drown out genuine sources. The internal boundary: even with perfect retrieval, the model can still drift, paraphrase a source incorrectly, or invent intermediate steps that were never in the evidence. SeekEngine assumes zero trust at both surfaces and verifies continuously rather than only at the end.',
  },
  {
    num: '06',
    title: 'Observability and Diagnostics',
    desc: 'You cannot debug a distributed system with intuition. SeekEngine ships with a built-in diagnostic terminal that exposes the full request lifecycle: the original query, the retrieval trace, the verification log, the model prompt, the streamed tokens, and the final synthesis. Every step is visible. Observability is not just a debugging tool here; it is the only honest way to audit whether the system is actually being honest.',
  },
  {
    num: '07',
    title: 'Partial Failures and Silent Errors',
    desc: 'Real systems do not fail loudly. They fail quietly. Retrieval returns no useful results. The model finishes first and waits. A network blip drops one of ten sources. A query times out and the user sees a partial answer. SeekEngine is designed around the assumption that partial failure is the default state, and the interface is built to make silent degradation visible rather than paper over it.',
  },
  {
    num: '08',
    title: 'What the System Taught Us',
    desc: 'After building and operating the system end to end, the most useful finding is conceptual. Hallucination is not a model problem; it is a coordination problem. Retrieval costs time, and time is the price of grounding. Truth, in a system like this, is not binary. It is distributed across sources, freshness, verification, and the synthesis step. A research prototype is the only honest way to find this out. Specs and benchmarks hide it.',
  },
]

export default function AboutContent() {
  return (
    <main className="relative min-h-screen bg-background pt-20 pb-24 font-sans transition-colors duration-700 sm:pt-24 sm:pb-40">

      <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-6">

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-10 sm:mb-12"
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
            <span className="px-3 py-1 rounded-full bg-foreground/[0.04] text-foreground/50 text-[11px] font-medium border border-foreground/[0.06]">
              Open Source
            </span>
            <span className="text-[11px] font-medium text-foreground/30 tracking-wide">Research Prototype</span>
          </div>
        </motion.section>

        {/* Intro */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-14 border-b border-foreground/[0.06] pb-12 sm:mb-16 sm:pb-14"
        >
          <h1 className="font-display text-[clamp(2.25rem,5.5vw,3.5rem)] leading-[0.95] tracking-tight text-foreground mb-5">
            About SeekEngine
          </h1>
          <div className="space-y-4 text-[15px] sm:text-base text-foreground/55 leading-relaxed font-light">
            <p>
              SeekEngine is a small, independent research project that rethinks how a search engine talks to a language model. Instead of letting a large language model answer questions from memory alone, the system first retrieves fresh, verifiable context from the public web, runs it through a strict verification gate, and only then asks the model to synthesize an answer grounded in what was actually found.
            </p>
            <p>
              The result is a search interface that behaves less like a chatbot and more like a careful researcher. It shows its sources, signals uncertainty, and refuses to invent. The project was built solo, on free-tier APIs, with the conviction that the next generation of search has to be auditable, not magical.
            </p>
          </div>
        </motion.section>

        {/* The Problem */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-14 border-b border-foreground/[0.06] pb-12 sm:mb-16 sm:pb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-5">
            The Problem
          </h2>
          <div className="space-y-4 text-[15px] sm:text-base text-foreground/55 leading-relaxed font-light">
            <p>
              Large language models are, at their core, sealed text generators. They have no native access to the live web, no built-in concept of a source, and no reliable way to tell the difference between a fact it has seen in training and a fact it is inventing on the fly. When they fail, the failure is silent and confident. The industry calls this hallucination.
            </p>
            <p>
              SeekEngine treats hallucination as a coordination problem, not a model problem. A model with no ground truth and no constraint is not broken; it is doing exactly what it was trained to do. The fix is structural: a system around the model that enforces what it can say, where it can say it from, and when it has to admit it does not know.
            </p>
          </div>
        </motion.section>

        {/* Research Journey */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-14 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            The Research Journey
          </h2>
          <p className="text-[15px] sm:text-base text-foreground/45 leading-relaxed font-light mb-10 max-w-2xl">
            SeekEngine was built as a sequence of deliberate experiments. Each phase surfaced a real failure mode in the previous one, and the architecture grew around those failures. The log below is the actual order in which the system was reasoned into existence.
          </p>

          <div className="space-y-0">
            {researchPhases.map((phase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.04 }}
                viewport={{ once: true, margin: '-80px' }}
                className="group"
              >
                <div className="flex gap-5 sm:gap-8">
                  {/* Phase number + line */}
                  <div className="relative flex flex-col items-center shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/[0.08] bg-foreground/[0.02] sm:h-9 sm:w-9 transition-colors group-hover:border-foreground/15 group-hover:bg-foreground/[0.04]">
                      <span className="text-[11px] font-medium text-foreground/40 tabular-nums">{phase.num}</span>
                    </div>
                    {idx < researchPhases.length - 1 && (
                      <div className="w-[1px] flex-1 bg-foreground/[0.06] mt-2 mb-0 group-hover:bg-foreground/[0.08] transition-colors" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-10 sm:pb-12">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 tracking-tight">
                      {phase.title}
                    </h3>
                    <p className="text-[14px] sm:text-[15px] text-foreground/50 leading-relaxed font-light">
                      {phase.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How it is built */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-14 border-b border-foreground/[0.06] pb-12 sm:mb-16 sm:pb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-5">
            How It Is Built
          </h2>
          <div className="space-y-4 text-[15px] sm:text-base text-foreground/55 leading-relaxed font-light">
            <p>
              SeekEngine runs as a Next.js application with a server-side orchestration layer that coordinates the retrieval and inference sides. The retrieval side uses Google Custom Search as a stable, well-documented grounding source. The inference side runs through OpenRouter, which keeps the system model-agnostic and portable across providers.
            </p>
            <p>
              Streaming is done over Server-Sent Events, and every request is reproducible from its trace. The diagnostic terminal, the verification logs, and the source-rendering layer are all part of the same architectural decision: a grounded system has to be inspectable, end to end, by anyone using it.
            </p>
          </div>
        </motion.section>

        {/* Closing */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: '-80px' }}
          className="mb-12"
        >
          <div className="space-y-4 text-[15px] sm:text-base text-foreground/55 leading-relaxed font-light">
            <p>
              SeekEngine is not a product. It is a research artifact. The goal is to make the cost of grounding visible, to make hallucination inspectable, and to keep the door open for anyone who wants to run, fork, or stress-test the ideas.
            </p>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          viewport={{ once: true }}
          className="mt-12 space-y-6 border-t border-foreground/[0.06] pt-10 sm:mt-16 sm:pt-12"
        >
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 tracking-tight">Research & Inquiries</h3>
            <div className="space-y-2.5">
              <p className="text-sm text-foreground/45 font-light">
                For architectural questions, research collaboration, or project discussion:
              </p>
              <div className="space-y-1.5">
                <p className="text-sm">
                  <span className="text-foreground/35">Researcher:</span> <span className="font-medium text-foreground">Gaurav Yadav</span>
                </p>
                <p className="text-sm">
                  <a href="mailto:gauravramyadav@gmail.com" className="text-foreground/50 hover:text-foreground underline underline-offset-4 decoration-foreground/15 hover:decoration-foreground/30 transition-colors font-medium">gauravramyadav@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 pt-4 sm:gap-7">
            <Link href="https://github.com/archduke1337/SeekEngine" target="_blank" className="text-[11px] font-medium text-foreground/30 hover:text-foreground transition-colors tracking-wide">GitHub</Link>
            <Link href="https://archduke.is-a.dev/research/seekengine" target="_blank" className="text-[11px] font-medium text-foreground/30 hover:text-foreground transition-colors tracking-wide">Research Paper</Link>
            <Link href="https://archduke.is-a.dev" target="_blank" className="text-[11px] font-medium text-foreground/30 hover:text-foreground transition-colors tracking-wide">Portfolio</Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
