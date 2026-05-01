'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AboutPage() {
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
    <main className="relative min-h-screen bg-[#fbfbfd] pt-20 pb-24 font-sans transition-colors duration-1000 selection:bg-blue-500/20 dark:bg-[#000000] sm:pt-24 sm:pb-40">
      
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none bg-grid-black/[0.01] dark:bg-grid-white/[0.01]" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 border-b border-black/5 pb-10 text-left dark:border-white/5 sm:mb-16 sm:pb-12"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase tracking-wide border border-blue-200 dark:border-blue-800">
                Open Source
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Research Prototype</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-black dark:text-white sm:text-6xl">
              SeekEngine
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
              A grounded hybrid retrieval system. Hallucination, reframed as a coordination problem. Built independently with free-tier APIs, zero budget, and the principle that truth has a cost.
            </p>
          </div>
        </motion.div>

        {/* Research Journey */}
        <div className="space-y-8 sm:space-y-10">
          {researchPhases.map((phase, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              viewport={{ once: true, margin: '-100px' }}
              className="group"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                {/* Phase number */}
                <div className="relative shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 sm:sticky sm:top-24 sm:h-10 sm:w-10">
                    <span className="text-xs font-black text-white">{phase.num.replace('0', '')}</span>
                  </div>
                  {idx < researchPhases.length - 1 && (
                    <div className="absolute left-4 top-10 hidden h-20 w-0.5 bg-gradient-to-b from-blue-500 to-transparent opacity-30 transition-opacity group-hover:opacity-50 sm:block" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-2">
                    {phase.title}
                  </h3>
                  <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16 space-y-6 border-t border-black/5 pt-10 dark:border-white/5 sm:mt-20 sm:pt-12"
        >
          <div>
            <h3 className="text-2xl font-bold text-black dark:text-white mb-4">Research & Inquiries</h3>
            <div className="space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                For architectural questions, research collaboration, or project discussion:
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-zinc-400">Researcher:</span> <span className="font-semibold text-black dark:text-white">Gaurav Yadav</span>
                </p>
                <p className="text-sm">
                  <a href="mailto:gauravramyadav@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">gauravramyadav@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 sm:gap-6">
            <Link href="https://github.com/archduke1337/SeekEngine" target="_blank" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black dark:hover:text-white transition-colors">GitHub</Link>
            <Link href="https://archduke.is-a.dev/research/seekengine" target="_blank" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Research Paper</Link>
            <Link href="https://archduke.is-a.dev" target="_blank" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Portfolio</Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
