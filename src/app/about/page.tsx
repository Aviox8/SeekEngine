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
    <main className="min-h-screen bg-[#fbfbfd] dark:bg-[#000000] pt-24 pb-40 transition-colors duration-1000 relative selection:bg-blue-500/20 font-sans">
      
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none bg-grid-black/[0.01] dark:bg-grid-white/[0.01]" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 border-b border-black/5 dark:border-white/5 pb-12 text-left"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase tracking-wide border border-blue-200 dark:border-blue-800">
                Open Source
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Research Prototype</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-black dark:text-white tracking-tight leading-tight">
              SeekEngine
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
              A grounded hybrid retrieval system. Hallucination, reframed as a coordination problem. Built independently with free-tier APIs, zero budget, and the principle that truth has a cost.
            </p>
          </div>
        </motion.div>

        {/* Research Journey */}
        <div className="space-y-10">
          {researchPhases.map((phase, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              viewport={{ once: true, margin: '-100px' }}
              className="group"
            >
              <div className="flex gap-6">
                {/* Phase number */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center sticky top-24">
                    <span className="text-xs font-black text-white">{phase.num.replace('0', '')}</span>
                  </div>
                  {idx < researchPhases.length - 1 && (
                    <div className="absolute top-10 left-4 w-0.5 h-20 bg-gradient-to-b from-blue-500 to-transparent opacity-30 group-hover:opacity-50 transition-opacity" />
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
          className="mt-20 pt-12 border-t border-black/5 dark:border-white/5 space-y-6"
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

          <div className="flex gap-6 pt-4">
            <Link href="https://github.com/archduke1337/SeekEngine" target="_blank" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black dark:hover:text-white transition-colors">GitHub</Link>
            <Link href="https://archduke.is-a.dev/research/seekengine" target="_blank" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Research Paper</Link>
            <Link href="https://archduke.is-a.dev" target="_blank" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Portfolio</Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
