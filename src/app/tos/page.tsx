'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function TermsOfService() {
  const sections = [

    {
      title: '1. What This Is',
      content: `SeekEngine is an open source research project released under the MIT License. You can use it, modify it, and redistribute it freely. The public instance at seekengine.vercel.app is provided as a demonstration. If you run your own instance, you control all data and policies for your deployment.`
    },
    {
      title: '2. MIT License',
      content: `SeekEngine is distributed under the MIT License. This means: (a) You can use, modify, and distribute the software freely; (b) The software is provided "as is" without warranty; (c) The authors are not liable for any issues arising from its use; (d) You must include the copyright notice and license in any redistribution. See the LICENSE file in the repository for the complete legal text.`
    },
    {
      title: '3. Research Project Disclaimer',
      content: `SeekEngine is a research system designed to explore grounding and verify factual claims. It is not a production search engine. The public demo may: (a) Return no results if queries cannot be verified; (b) Have rate limits and availability constraints; (c) Be modified or taken down without notice; (d) Fail silently under heavy load. We prioritize accuracy over uptime. If you need reliable search, use established services.`
    },
    {
      title: '4. Third-Party Dependencies',
      content: `The public demo uses Google Custom Search and OpenRouter APIs. These services have their own terms of service, which you implicitly agree to by using SeekEngine. We are not responsible for their availability, policies, or data practices. If you deploy SeekEngine yourself, you choose which backends to use.`
    },
    {
      title: '5. Data Collection (Public Demo)',
      content: `The public instance logs: (a) Anonymized query patterns for debugging and research; (b) IP addresses (not stored persistently); (c) Response times and error rates. We do not sell or share data. Logs are retained for 90 days and then deleted. If you run your own SeekEngine instance, you control all logging and data retention.`
    },
    {
      title: '6. No Hallucination Warranty',
      content: `SeekEngine attempts to ground responses in retrieved facts, but this is not foolproof. Grounding can fail silently. Retrieved sources can be wrong. LLMs can misinterpret context. Use SeekEngine as a research tool, not as a source of truth. Always verify important information independently.`
    },
    {
      title: '7. Acceptable Use',
      content: `Do not use SeekEngine to: (a) Generate spam or malicious content; (b) Bypass rate limits through automation; (c) Attack our systems or upstream providers; (d) Conduct prompt injection or jailbreak attempts; (e) Reverse engineer or extract our infrastructure. Violations may result in access revocation.`
    },
    {
      title: '8. Limitations',
      content: `SeekEngine has known limitations: (a) English-language focus; (b) Dependency on external APIs (not controlled by us); (c) Latency penalty for verification (~300ms); (d) Rate limits from upstream providers; (e) No formal accuracy benchmarks. These are not bugs; they are architectural tradeoffs.`
    },
    {
      title: '9. Contributing',
      content: `SeekEngine welcomes contributions. By submitting pull requests, you agree that your contributions can be distributed under the MIT License. See CONTRIBUTING.md in the repository for guidelines.`
    },
    {
      title: '10. Contact',
      content: `For questions about these terms, the project, or the research behind it, open an issue on GitHub or contact the maintainers. For abuse reports on the public demo, email gauravramyadav@gmail.com.`
    }
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
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">MIT License</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-black dark:text-white tracking-tight leading-tight">
              Terms of Service
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
              SeekEngine is open source under the MIT License. This page explains the terms for using the public demo and what you get with the code.
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center sticky top-24">
                    <span className="text-xs font-black text-white">
                      {idx + 1}
                    </span>
                  </div>
                  {idx < sections.length - 1 && (
                    <div className="absolute top-10 left-4 w-0.5 h-20 bg-gradient-to-b from-blue-500 to-transparent opacity-30 group-hover:opacity-50 transition-opacity" />
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
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            These terms were last updated in January 2026. For the complete license text, see the <Link href="https://github.com/archduke1337/SeekEngine/blob/main/LICENSE" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">LICENSE</Link> file on GitHub.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            For questions or clarification, see our <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Privacy Policy</Link> or open an issue on <Link href="https://github.com/archduke1337/SeekEngine" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">GitHub</Link>.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
