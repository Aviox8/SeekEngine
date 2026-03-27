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
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest border border-black/5 dark:border-white/5">Research Release v2.1</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Cluster</span>
                </div>
                <h1 className="text-4xl sm:text-7xl font-bold text-black dark:text-white tracking-tight leading-[0.9]">
                    Project Manifest.
                </h1>
            </div>
            <div className="text-right hidden md:block text-zinc-400">
                <p className="text-[10px] font-mono uppercase tracking-widest leading-relaxed">
                    Last Update: Jan 01, 2026 <br />
                    Pune, India
                </p>
            </div>
        </div>

        {/* Narrative Flow */}
        <div className="space-y-40 pb-20">
          
          {/* Section 01: Philosophy */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-left">
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">01 — Philosophy</p>
                    <h2 className="text-3xl sm:text-5xl font-bold text-black dark:text-white tracking-tight">Signal over Noise.</h2>
                </div>
                <div className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-4">
                    <p>
                        The modern web is decaying into &ldquo;confident misinformation.&rdquo; Generative AI has accelerated this entropy, prioritizing fluent lies over jagged truths.
                    </p>
                    <p>
                        SeekEngine rejects the probabilistic guess. We do not optimize for chat; we optimize for <span className="text-black dark:text-white font-semibold">grounding</span>. Every output must be tethered to a verifiable index node. If we cannot prove it, we do not say it.
                    </p>
                </div>
            </div>
            
            {/* Visual: Logic Map - Parallel Orchestration */}
            <div className="relative p-8 sm:p-12 rounded-[3rem] bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden group">
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 dark:opacity-40" viewBox="0 0 400 400">
                    <motion.path
                        d="M 50 100 L 350 100 L 350 300 L 50 300 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        strokeDasharray="4 4"
                    />
                    <motion.circle
                        r="3"
                        fill="#ef4444"
                        {...({
                            animate: { offsetDistance: ["0%", "100%"] },
                            transition: { duration: 10, repeat: Infinity, ease: "linear" },
                            style: { offsetPath: "path('M 50 100 L 350 100 L 350 300 L 50 300 Z')" }
                        } as any)}
                    />
                </svg>

                <div className="relative z-10 space-y-12">
                    {[
                        { step: "01", title: "Query Injection", desc: "Zod Schema Validation & Sanitization.", color: "bg-red-500" },
                        { step: "02", stepActive: true, title: "Parallel Orchestration", desc: "Concurrent threads: Google CSE + OpenRouter LLM", color: "bg-zinc-800 dark:bg-white" },
                        { step: "03", title: "Fusion Layer", desc: "Source-Referenced Synthesis (SRS).", color: "bg-green-500" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-6 group/item">
                            <div className={`shrink-0 w-12 h-12 rounded-2xl ${item.stepActive ? item.color : 'bg-zinc-100 dark:bg-zinc-800'} flex items-center justify-center transition-all group-hover/item:scale-110 shadow-lg`}>
                                <span className={`text-xs font-black ${item.stepActive ? 'text-white dark:text-black' : 'text-zinc-400'}`}>{item.step}</span>
                            </div>
                            <div className="space-y-1 pt-1">
                                <h4 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">{item.title}</h4>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-500 leading-none">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-6 right-8 opacity-40 group-hover:opacity-100 transition-opacity">
                    <p className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">
                        Fig 01.0 — Parallel Orchestration Model <br />
                        Latency-Accuracy Trade-off Analysis
                    </p>
                </div>
            </div>
          </section>

          {/* Section 02: Intent */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
            <div className="lg:order-2 space-y-8 text-left">
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">02 — Intent</p>
                    <h2 className="text-3xl sm:text-5xl font-bold text-black dark:text-white tracking-tight">System Integrity.</h2>
                </div>
                <div className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-4">
                    <p>
                        The intent is to engineer a system that is hostile to hallucination.
                    </p>
                    <p>
                        We enforce strict <span className="text-black dark:text-white font-semibold">Environment Encapsulation</span>. All inference logic is isolated in server-side route handlers, acting as a security proxy. We accept the &ldquo;Truth Penalty&rdquo;—a 300ms latency cost—to verify every token before it reaches the client.
                    </p>
                </div>
                <div className="pt-4">
                    <Link 
                        href="https://archduke.is-a.dev/research/seekengine" 
                        target="_blank"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                        Research Paper
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>
            </div>
            
            {/* Visual: UI Blueprint - Live Synthesis Flow */}
            <div className="lg:order-1 relative p-1 rounded-[3.5rem] bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 overflow-hidden shadow-inner group">
                <div className="bg-white dark:bg-black m-6 rounded-[2rem] border border-black/5 dark:border-white/5 p-8 space-y-6 shadow-2xl relative overflow-hidden">
                    {/* Live Flow HUD Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Environment_Encapsulation</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-300">Secure_Proxy_Active</span>
                    </div>

                    {/* Data Ingestion Path */}
                    <div className="relative h-32 w-full bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-black/5 dark:border-white/5 p-4 overflow-hidden">
                        <div className="flex justify-between h-full">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="w-px h-full bg-zinc-200 dark:bg-zinc-800 relative">
                                    <motion.div 
                                        {...({
                                            animate: { y: ["0%", "400%"] },
                                            transition: { duration: 2 + i, repeat: Infinity, ease: "linear" },
                                            className: "absolute -top-4 left-[-1.5px] w-[4px] h-4 bg-gradient-to-t from-red-500 to-transparent shadow-[0_0_8px_red]"
                                        } as any)}
                                    />
                                </div>
                            ))}
                            <div className="absolute inset-x-0 bottom-4 px-4 flex justify-between">
                                <span className="text-[7px] font-bold text-zinc-400 tracking-tighter">CLIENT_LAYER</span>
                                <span className="text-[7px] font-bold text-zinc-400 tracking-tighter">SERVER_PROXY</span>
                                <span className="text-[7px] font-bold text-zinc-400 tracking-tighter">UPSTREAM_API</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Consensus Core */}
                    <div className="p-6 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black space-y-4">
                        <div className="flex justify-between items-center">
                            <h5 className="text-[10px] font-black uppercase tracking-widest leading-none">Threat_Mitigation_Status</h5>
                            <span className="text-[8px] font-bold opacity-50">Active</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[7px] font-black opacity-50 uppercase"><span>XSS_Injection</span><span>Mitigated</span></div>
                                <div className="h-1 w-full bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        {...({
                                            initial: { width: 0 },
                                            animate: { width: "100%" },
                                            className: "h-full bg-emerald-500"
                                        } as any)} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[7px] font-black opacity-50 uppercase"><span>Creds_Leakage</span><span>Mitigated</span></div>
                                <div className="h-1 w-full bg-white/10 dark:bg-black/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        {...({
                                            initial: { width: 0 },
                                            animate: { width: "100%" },
                                            className: "h-full bg-emerald-500"
                                        } as any)} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 opacity-40 group-hover:opacity-100 transition-opacity">
                        <p className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] text-center">
                            Fig 02.1 — Server-Side Security Proxy & Data Sanitization
                        </p>
                    </div>
                </div>
            </div>
          </section>

          {/* Section 03: Constraints */}
          <section className="space-y-12 text-left">
            <div className="max-w-3xl space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">03 — Constraints</p>
                <h2 className="text-3xl sm:text-6xl font-bold text-black dark:text-white tracking-tight">Zero-Budget Engineering.</h2>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                    Creativity thrives in constraint. We built a high-fidelity retrieval system without enterprise capital, relying on efficient architecture over brute force.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {
                        title: "Frontend Stack",
                        desc: "Next.js 14 and Framer Motion. Zero extraneous heavy libraries. Performance by default.",
                    },
                    {
                        title: "Inference Layer",
                        desc: "OpenRouter & Google CSE. We leverage existing high-grade APIs rather than training massive models from scratch.",
                    },
                    {
                        title: "Security Core",
                        desc: "Strict DOMPurify and Zod validation. We treat every external input as a hostile vector.",
                    }
                ].map((spec, i) => (
                    <div key={i} className="p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5">
                        <h3 className="text-xl font-bold text-black dark:text-white mb-3 tracking-tight">{spec.title}</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{spec.desc}</p>
                    </div>
                ))}
            </div>
          </section>

          {/* Section 04: Specs */}
          <section className="bg-zinc-900 text-white rounded-[3rem] p-8 sm:p-16 text-left relative overflow-hidden ring-1 ring-white/10">
            <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="space-y-8">
                    <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">04 — Output</p>
                        <h2 className="text-3xl font-bold tracking-tight">System Specifications.</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: "Technical Manuscript", val: "v2.1 Stable" },
                            { label: "Grounding Benchmark", val: "Hybrid RAG Pipeline" },
                            { label: "Security Protocol", val: "Environment Encapsulation" },
                            { label: "Documentation", val: "Archduke Research" }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{item.label}</span>
                                <span className="text-xs font-mono text-zinc-200">{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="space-y-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-left">Real-time Metrics</p>
                        <h2 className="text-3xl font-bold text-white tracking-tight text-left">Industrial Specs.</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Fusion Overhead", val: "~300ms" },
                            { label: "Total Latency", val: "~1500ms" },
                            { label: "Model Tier", val: "OpenRouter" },
                            { label: "Constraint", val: "Zero-Budget" }
                        ].map((item, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{item.label}</p>
                                <p className="text-lg font-bold text-white">{item.val}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </section>
          
          {/* Section 05: Contact */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-black/5 dark:border-white/5">
            <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">05 — Contact</p>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-black dark:text-white">Project Correspondence.</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">For research inquiries or architectural discussion.</p>
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
