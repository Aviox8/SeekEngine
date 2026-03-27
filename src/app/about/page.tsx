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
      
      {/* Background Layers */}
      <div className="fixed inset-0 pointer-events-none bg-grid-black/[0.01] dark:bg-grid-white/[0.01]" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24 border-b border-black/5 dark:border-white/5 pb-10 text-left">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest border border-blue-200 dark:border-blue-800">Independent Research</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Distributed Systems</span>
                </div>
                <h1 className="text-4xl sm:text-7xl font-bold text-black dark:text-white tracking-tight leading-[0.9]">
                    SeekEngine.
                </h1>
                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                    A grounded hybrid retrieval system that treats hallucination as a distributed coordination problem, not an AI defect. Built with zero budget, free-tier APIs, and the principle that truth has a cost.
                </p>
            </div>
            <div className="text-right hidden md:block text-zinc-400">
                <p className="text-[10px] font-mono uppercase tracking-widest leading-relaxed">
                    January 2026 <br />
                    Pune, India
                </p>
            </div>
        </div>

        {/* Narrative Flow */}
        <div className="space-y-40 pb-20">
          
          {/* Section 01: The Problem Reframed */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-left">
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">01 — The Core Insight</p>
                    <h2 className="text-3xl sm:text-5xl font-bold text-black dark:text-white tracking-tight">Hallucination is Isolation.</h2>
                </div>
                <div className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-4">
                    <p>
                        Large language models generate tokens based on internal priors built during training. They cannot access the live web. When asked "What is AAPL stock price right now?", the model doesn't know—it has no external state to query. So it fabricates a plausible number. This is not a hallucination defect. It's the model's fallback policy for missing context.
                    </p>
                    <p>
                        Reframe the problem: <span className="text-black dark:text-white font-semibold">Hallucination is what happens when an inference node operates in isolation.</span> The fix isn't a better model. It's turning an isolated node into a coordinated system.
                    </p>
                </div>
            </div>
            
            {/* Visual: Problem Framing */}
            <div className="relative p-8 sm:p-12 rounded-[3rem] bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden group">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">The Isolation Problem</h4>
                        <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                                <p className="text-xs font-mono text-red-900 dark:text-red-200">
                                    <span className="font-bold">User:</span> What's Apple's stock price? <br />
                                    <span className="font-bold">LLM:</span> $245.30 (confident) <br />
                                    <span className="text-red-700 dark:text-red-300">^ Complete fabrication. Model has no web access.</span>
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                                <p className="text-xs font-mono text-green-900 dark:text-green-200">
                                    <span className="font-bold">System:</span> [Query web] AAPL $195.72 <br />
                                    <span className="font-bold">LLM+Grounding:</span> Apple trades at $195.72 (verified) <br />
                                    <span className="text-green-700 dark:text-green-300">^ Grounded. Context provided externally.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">
                            The difference: External context eliminates the gap the model fills with confabulation.
                        </p>
                    </div>
                </div>
            </div>
          </section>

          {/* Section 02: The Architecture */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
            <div className="lg:order-2 space-y-8 text-left">
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">02 — The Solution</p>
                    <h2 className="text-3xl sm:text-5xl font-bold text-black dark:text-white tracking-tight">Parallel Fusion.</h2>
                </div>
                <div className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-4">
                    <p>
                        The fix is architectural: run retrieval and inference in parallel, then fuse the outputs through a verification protocol. Google CSE provides sparse, timestamped context from the live web. OpenRouter provides structured synthesis. Neither node is sufficient alone—retrieval is brittle without synthesis, inference is blind without grounding.
                    </p>
                    <p>
                        The fusion layer operates under three constraints: claims must be grounded (existence gate), claims must match retrieved context (consistency gate), and sources must be credible (source gate). If verification fails, the system returns silence rather than fabrication.
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                        This trades 300ms of latency for factual integrity. The "truth penalty" is the cost of coordination.
                    </p>
                </div>
            </div>
            
            {/* Visual: Architecture Diagram */}
            <div className="lg:order-1 relative p-8 sm:p-12 rounded-[3rem] bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden">
                <div className="space-y-8">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">System Layers</h4>
                    
                    <div className="space-y-4">
                        {[
                            { layer: 'Layer 1', title: 'Retrieval', desc: 'Google CSE', color: 'from-blue-500 to-blue-600' },
                            { layer: 'Layer 2', title: 'Inference', desc: 'OpenRouter LLM', color: 'from-purple-500 to-purple-600' },
                            { layer: 'Layer 3', title: 'Fusion', desc: 'Verification Protocol', color: 'from-green-500 to-green-600', active: true },
                            { layer: 'Layer 4', title: 'UI', desc: 'Epistemic Surface', color: 'from-slate-500 to-slate-600' }
                        ].map((item, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${item.active ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex-shrink-0 flex items-center justify-center`}>
                                        <span className="text-xs font-bold text-white">{item.layer.split(' ')[1]}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="text-sm font-bold text-black dark:text-white">{item.title}</h5>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">
                            Verification = Truth Gate. All claims must be verifiable or fail silent.
                        </p>
                    </div>
                </div>
            </div>
          </section>

          {/* Section 03: Research Journey */}
          <section className="space-y-12 text-left">
            <div className="max-w-3xl space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">03 — The Eight Phases</p>
                <h2 className="text-3xl sm:text-6xl font-bold text-black dark:text-white tracking-tight">How the System Emerged.</h2>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                    This project wasn't designed on a whiteboard. It evolved through eight iterative phases of research, failure, and refinement. Each failure revealed architectural truths.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {researchPhases.map((phase, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        viewport={{ once: true, margin: '-50px' }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <span className="text-xs font-black text-white">{phase.num}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-black dark:text-white mb-1">{phase.title}</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{phase.desc}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
          </section>

          {/* Section 04: Independence & Methodology */}
          <section className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-[3rem] p-8 sm:p-16 text-left relative overflow-hidden ring-1 ring-white/10">
            <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="space-y-8">
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">04 — Independent Research</p>
                        <h2 className="text-3xl font-bold tracking-tight">Built with Constraints.</h2>
                    </div>
                    <div className="space-y-4">
                        <p className="text-base leading-relaxed">
                            This project was built with zero funding, zero proprietary infrastructure, and free-tier APIs. Those constraints weren't obstacles—they were signal generators.
                        </p>
                        <div className="space-y-3 text-sm">
                            <div className="flex gap-3">
                                <span className="text-blue-300 font-bold flex-shrink-0">→</span>
                                <p><span className="font-semibold">No private infra</span> forced us to reason about security boundaries</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-blue-300 font-bold flex-shrink-0">→</span>
                                <p><span className="font-semibold">No vector DB</span> forced us to treat retrieval as a coordination problem</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-blue-300 font-bold flex-shrink-0">→</span>
                                <p><span className="font-semibold">Rate limits</span> became observable failures, not abstractions</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-blue-300 font-bold flex-shrink-0">→</span>
                                <p><span className="font-semibold">Uncontrolled latency</span> forced us to build for partial failure</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300 text-left">Research Positioning</p>
                        <h3 className="text-2xl font-bold text-white tracking-tight text-left">Systems Thinking.</h3>
                    </div>
                    <div className="space-y-3">
                        <p className="text-sm leading-relaxed">
                            SeekEngine belongs to the lineage of independent systems research: BitTorrent hackers, personal kernel projects, and curious engineers who build in the open.
                        </p>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {[
                                { label: 'Methodology', val: 'Empirical' },
                                { label: 'Validation', val: 'Reality Testing' },
                                { label: 'Philosophy', val: 'Zero-Trust' },
                                { label: 'Transparency', val: 'Open-Source' }
                            ].map((item, i) => (
                                <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur">
                                    <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className="text-sm font-semibold text-white">{item.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </section>
          
          {/* Section 05: Research Insights */}
          <section className="space-y-8 text-left border-t border-black/5 dark:border-white/5 pt-12">
            <div className="max-w-3xl space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">05 — Key Insights</p>
                <h2 className="text-3xl sm:text-5xl font-bold text-black dark:text-white tracking-tight">What We Learned.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    {
                        title: 'Hallucination is Coordination',
                        content: 'Ungrounded LLMs don\'t fail—they fall back to plausible guessing. Ground them with retrieval and it becomes a systems problem, not an AI problem.'
                    },
                    {
                        title: 'Truth Has a Cost',
                        content: 'Grounding requires verification. Verification takes time. The 300ms latency penalty isn\'t a bug; it\'s proof-of-work for accuracy.'
                    },
                    {
                        title: 'Retrieval ≠ Sufficiency',
                        content: 'Retrieval alone produces brittle facts. LLMs alone produce fluent lies. Truth emerges from coordination between both nodes.'
                    },
                    {
                        title: 'Failure is Observable',
                        content: 'Real distributed systems don\'t crash—they degrade. Partial failures, stale context, rate limits. These are signals, not noise to hide.'
                    }
                ].map((insight, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.08 }}
                        viewport={{ once: true, margin: '-50px' }}
                        className="p-6 sm:p-8 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                    >
                        <h3 className="text-lg font-bold text-black dark:text-white mb-2">{insight.title}</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{insight.content}</p>
                    </motion.div>
                ))}
            </div>

            <div className="pt-8">
                <Link 
                    href="https://archduke.is-a.dev/research/seekengine" 
                    target="_blank"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                    Read Full Research Paper
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </Link>
            </div>
          </section>
          
          {/* Section 06: Contact */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-black/5 dark:border-white/5">
            <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">06 — Connect</p>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-black dark:text-white">Research & Inquiries.</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">For architectural questions, research collaboration, or project discussion.</p>
                </div>
            </div>
            <div className="space-y-6">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Researcher</p>
                    <p className="text-lg font-bold text-black dark:text-white">Gaurav Yadav</p>
                    <p className="text-xs font-mono text-zinc-500">archduke1337 — Pune, India</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Direct Line</p>
                    <a href="mailto:gauravramyadav@gmail.com" className="text-lg font-bold text-black dark:text-white hover:text-red-500 transition-colors">gauravramyadav@gmail.com</a>
                </div>
                <div className="flex gap-6 pt-2">
                    <Link href="https://github.com/archduke1337/SeekEngine" target="_blank" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black dark:hover:text-white transition-colors">GitHub</Link>
                    <Link href="https://archduke.is-a.dev" target="_blank" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Portfolio</Link>
                </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
