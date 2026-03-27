'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function PrivacyPolicy() {
  const sections = [
    {
      title: '1. This is an Open Source Project',
      content: `SeekEngine is released under the MIT License. The code is public and auditable on GitHub. If you run your own instance, you have complete control over data collection and retention. This privacy policy describes the public demo at seekengine.vercel.app. Your own deployment can have different policies entirely.`
    },
    {
      title: '2. What Data We Collect (Public Demo)',
      content: `The public demo collects minimal data: (a) Query text—stored for ~3 hours to detect patterns, then deleted; (b) IP address—hashed and not persistently stored; (c) Timestamps and response times for debugging; (d) Success/failure rates of searches. We do not track individual users. We do not use cookies. We do not fingerprint browsers. Essentially: we log just enough to understand if the system is working.`
    },
    {
      title: '3. Why We Collect This Data',
      content: `Data collection serves one purpose: research into grounding and retrieval-augmented generation. We need to understand: (a) How often queries return no results (indicating verification failure); (b) Response time patterns (latency of the grounding process); (c) Which types of queries succeed vs. fail; (d) System error rates. This helps us improve the grounding algorithm. Data is never used for marketing, profiling, or commercial purposes.`
    },
    {
      title: '4. Data Retention & Deletion',
      content: `Query logs are retained for 90 days, then automatically deleted. IP addresses are hashed and purged after 24 hours. Error traces are kept for 30 days. After these periods, data is gone. We do not maintain long-term user profiles or history. If you're concerned about specific queries, run SeekEngine locally where you control retention.`
    },
    {
      title: '5. Third-Party Data Sharing',
      content: `We do not sell or share user data. However, the public demo uses external APIs: (a) Google Custom Search—receives your search query; (b) OpenRouter—receives context for synthesis. These are legitimate, privacy-respecting services, but you should review their policies. For sensitive queries, run SeekEngine on your own hardware with your own API keys.`
    },
    {
      title: '6. Security & Data Protection',
      content: `Data is transmitted over HTTPS. API keys are server-side only—never exposed to the client. Queries are not logged with personally identifiable information. We follow basic security hygiene: input validation, XSS protection, rate limiting. However, we are a research project, not a hardened service. For production use, audit the code yourself or run it locally.`
    },
    {
      title: '7. Your Rights & Control',
      content: `Since we don't build user profiles, there's little to retrieve or delete. But you have options: (a) Use the public demo anonymously (we don't track you); (b) Run SeekEngine locally for complete privacy; (c) Fork the code and modify it however you want. Open source means you have agency. Use that.`
    },
    {
      title: '8. GDPR & Privacy Regulations',
      content: `We operate under the principle that minimal data collection = minimal compliance burden. We don't build profiles, so GDPR's "right to be forgotten" is straightforward—there's nothing to forget. For EU residents: we comply with data protection principles by design. If you use SeekEngine, you're in control of your data.`
    },
    {
      title: '9. Analytics & Observability',
      content: `We use aggregated analytics to monitor system health. Example: "90% of queries succeeded" vs. "User @abc123 searched for X." We never do the latter. Observability is necessary for debugging, but it's done at the aggregate level. We do not track individual behavior over time.`
    },
    {
      title: '10. Changes to This Policy',
      content: `If we change data practices, we'll update this page and mention it in the GitHub repository. Continued use implies acceptance. But here's the thing: if you don't like our practices, you can fork the code and run your own version with different policies. That's the power of open source.`
    },
    {
      title: '11. Self-Hosting & Data Sovereignty',
      content: `The best privacy guarantee: run SeekEngine on your own server. You control all data. You choose which APIs to use. You decide retention policies. Docker setup is available in the repository. This is the intended use case for sensitive deployments.`
    },
    {
      title: '12. Contact & Transparency',
      content: `Questions about privacy? Open an issue on GitHub. Want to audit the code? It's all there. Want to see what data we collect? Check the server logs in the implementation. Transparency is built in. We have nothing to hide because the project itself is auditable.`
    }
  ]

  return (
    <main className="min-h-screen bg-[#fbfbfd] dark:bg-[#000000] pt-24 pb-40 transition-colors duration-1000 relative selection:bg-purple-500/20 font-sans">
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
              <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[9px] font-bold uppercase tracking-wide border border-purple-200 dark:border-purple-800">
                Open Source
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Self-Hostable</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-black dark:text-white tracking-tight leading-tight">
              Privacy Policy
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
              SeekEngine is open source. That means: your code is visible, your data practices are obvious, and you have full control. This policy covers the public demo. For your own instance, you decide the rules.
            </p>
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-10">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              viewport={{ once: true, margin: '-100px' }}
              className="group"
            >
              <div className="flex gap-6">
                {/* Section number indicator */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center sticky top-24">
                    <span className="text-xs font-black text-white">
                      {idx + 1}
                    </span>
                  </div>
                  {idx < sections.length - 1 && (
                    <div className="absolute top-10 left-4 w-0.5 h-20 bg-gradient-to-b from-purple-500 to-transparent opacity-30 group-hover:opacity-50 transition-opacity" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-3">
                    {section.title}
                  </h2>
                  <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-20 pt-12 border-t border-black/5 dark:border-white/5 space-y-4"
        >
          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 space-y-3">
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
              The OpenSource Advantage
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              With SeekEngine, you're not trusting a company's privacy promises—you can audit the code yourself. Run it on your own hardware. Modify it. That's the entire point of open source. Your data, your rules.
            </p>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            For questions: see our <Link href="/tos" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">Terms of Service</Link>, check the <Link href="https://github.com/archduke1337/SeekEngine" target="_blank" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">GitHub repository</Link>, or open an issue with questions. Last updated: January 2026.
          </p>
        </motion.div>
      </div>
    </main>
  )
}


