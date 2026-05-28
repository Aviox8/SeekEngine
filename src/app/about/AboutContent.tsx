'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AboutContent() {
  const researchPhases = [
    { num: '01', title: 'Grounding the Problem', desc: 'LLMs are sealed containers without access to the web. Hallucination isn\'t a bug—it\'s a fallback when there\'s no external state.' },
    { num: '02', title: 'Retrieval as Bootstrap', desc: 'Google CSE acts as a bootstrap node. Parallel search provides the context substrate that makes grounded reasoning possible.' },
    { num: '03', title: 'Parallel Orchestration', desc: 'Running retrieval and inference in parallel creates a distributed coordination problem. Truth emerges from fusion, not from either node alone.' },
    { num: '04', title: 'Verification as Protocol', desc: 'Grounding requires explicit verification gates: existence, consistency, temporal freshness, source credibility. Only verified output is synthesized.' },
    { num: '05', title: 'Security & Adversarial Surface', desc: 'Two-front security: external (poisoned web results) and internal (model hallucination). Zero-trust toward both boundaries.' },
    { num: '06', title: 'Observability & Diagnostics', desc: 'Distributed systems cannot be debugged through intuition. Made failure visible through diagnostic terminal—observability as epistemology.' },
    { num: '07', title: 'Partial Failures & Silent Errors', desc: 'Retrieval starvation, inference starvation, timing desynchronization. Real systems degrade silently; this is signal, not noise.' },
    { num: '08', title: 'Research Insights', desc: 'Hallucination is coordination failure. Grounding costs time. Truth isn\'t binary—it\'s distributed. Systems research reveals what specs hide.' }
  ]

  return (
    <main className="relative min-h-screen bg-background pt-20 pb-24 font-sans transition-colors duration-700 selection:bg-foreground/10 sm:pt-24 sm:pb-40">

      <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-14 border-b border-foreground/[0.06] pb-10 text-left sm:mb-16 sm:pb-12"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-foreground/[0.04] text-foreground/60 text-[9px] font-semibold uppercase tracking-[0.1em] border border-foreground/[0.08]">
                Open Source
              </span>
              <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-[0.12em]">Research Prototype</span>
            </div>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] tracking-tight text-foreground">
              SeekEngine
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground/80 sm:text-base">
              A grounded hybrid retrieval system. Hallucination, reframed as a coordination problem. Built independently with free-tier APIs, zero budget, and the principle that truth has a cost.
            </p>
          </div>
        </motion.div>

        {/* Research Journey */}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/[0.1] bg-foreground/[0.03] sm:h-9 sm:w-9 transition-colors group-hover:border-foreground/20 group-hover:bg-foreground/[0.06]">
                    <span className="text-[11px] font-semibold text-foreground/50 tabular-nums">{phase.num}</span>
                  </div>
                  {idx < researchPhases.length - 1 && (
                    <div className="w-[1px] flex-1 bg-foreground/[0.06] mt-2 mb-0 group-hover:bg-foreground/[0.1] transition-colors" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-10 sm:pb-12">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 tracking-tight">
                    {phase.title}
                  </h3>
                  <p className="text-[14px] sm:text-[15px] text-muted-foreground/70 leading-relaxed">
                    {phase.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

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
              <p className="text-sm text-muted-foreground/70">
                For architectural questions, research collaboration, or project discussion:
              </p>
              <div className="space-y-1.5">
                <p className="text-sm">
                  <span className="text-muted-foreground/50">Researcher:</span> <span className="font-semibold text-foreground">Gaurav Yadav</span>
                </p>
                <p className="text-sm">
                  <a href="mailto:gauravramyadav@gmail.com" className="text-foreground/70 hover:text-foreground underline underline-offset-4 decoration-foreground/20 hover:decoration-foreground/40 transition-colors font-medium">gauravramyadav@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 pt-4 sm:gap-7">
            <Link href="https://github.com/archduke1337/SeekEngine" target="_blank" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/35 hover:text-foreground transition-colors">GitHub</Link>
            <Link href="https://archduke.is-a.dev/research/seekengine" target="_blank" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/35 hover:text-foreground transition-colors">Research Paper</Link>
            <Link href="https://archduke.is-a.dev" target="_blank" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/35 hover:text-foreground transition-colors">Portfolio</Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
