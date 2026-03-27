'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function TermsOfService() {
  const sections = [
    {
      title: '1. Service Description',
      content: `SeekEngine is an independent research system that synthesizes search results using hybrid retrieval and inference. The service operates under a grounding-first philosophy: all responses must be tethered to retrieved web sources or we remain silent. We do not optimize for eloquence; we optimize for verifiability. The system relies on Google Custom Search (retrieval) and OpenRouter (inference), and our service quality depends on their availability. We accept a truth penalty—approximately 300ms additional latency—to verify outputs before returning them. By using SeekEngine, you acknowledge that this grounded approach may return fewer results or shorter answers than unfiltered systems.`
    },
    {
      title: '2. Acceptable Use',
      content: `You agree not to use SeekEngine for: (a) unauthorized access or interference with our systems; (b) generating, distributing, or indexing spam, malware, or illegal content; (c) circumventing rate limits or security mechanisms; (d) reverse engineering, scraping, or automated data extraction; (e) impersonating others or creating fraudulent accounts; (f) violating applicable laws or third-party rights.`
    },
    {
      title: '3. Intellectual Property',
      content: `SeekEngine content, including UI/UX design, algorithms, and proprietary infrastructure, remains our property or that of our licensors. Search results and web source content are attributed to their original publishers. You may not reproduce, distribute, or commercialize our service or its components without explicit permission. User-generated queries are retained for service improvement, anonymized where possible.`
    },
    {
      title: '4. Third-Party Services',
      content: `SeekEngine integrates Google Custom Search, OpenRouter LLM routing, and other third-party services. We are not responsible for third-party service outages, data policies, or content. By using SeekEngine, you implicitly accept third-party terms of service. We may modify, discontinue, or restrict access to features at any time.`
    },
    {
      title: '5. Disclaimer of Warranties',
      content: `SeekEngine is provided "as is" without warranties of accuracy, completeness, or fitness for purpose. We do not guarantee that search results are current, unbiased, or free from errors. AI-generated synthesis may contain factual inaccuracies, biased reasoning, or unsupported claims. You should verify important information through authoritative sources. Use at your own risk.`
    },
    {
      title: '6. Limitation of Liability',
      content: `To the maximum extent permitted by law, SeekEngine and its operators are not liable for direct, indirect, incidental, consequential, or punitive damages arising from service use or inability to use. This includes data loss, business interruption, or reliance on inaccurate information. Some jurisdictions limit liability disclaimers; applicable law governs.`
    },
    {
      title: '7. Privacy & Data',
      content: `See our Privacy Policy for details on data collection, processing, and retention. We collect anonymized query logs, interaction patterns, and session metadata for service analytics. User data is not sold to third parties. We retain the right to aggregate anonymized insights for research purposes. You consent to these practices by using SeekEngine.`
    },
    {
      title: '8. Rate Limiting & Access Restrictions',
      content: `SeekEngine implements rate limits to prevent abuse and ensure fair access. Excessive requests may result in temporary or permanent IP bans. Rapid-fire queries, automated scraping, or multi-threaded access violate our terms. We reserve the right to throttle or deny service to users or organizations exceeding reasonable thresholds.`
    },
    {
      title: '9. Modifications to Terms',
      content: `We may update these terms at any time. Continued service use after updates constitutes acceptance. Material changes will be notified via website notice or email. You are responsible for reviewing terms periodically. If you disagree with changes, discontinue service use.`
    },
    {
      title: '10. Termination',
      content: `We reserve the right to suspend or terminate access for violations of these terms, abuse, or legal requirements. Termination may be immediate without notice for severe violations. Upon termination, your right to use SeekEngine ceases, though archived legal requirements may obligate continued data retention.`
    },
    {
      title: '11. Jurisdiction & Dispute Resolution',
      content: `These terms are governed by applicable law. Any disputes arising shall be resolved through binding arbitration or small claims court, at the user's discretion. By using SeekEngine, you waive the right to jury trial or class action. Legal proceedings must be initiated within one year of the dispute arising.`
    },
    {
      title: '12. Contact & Support',
      content: `For inquiries, concerns, or abuse reports, contact us at the email provided on our website. Responses to legitimate requests will be made within 15 business days. For emergency legal matters, requests should be submitted through official channels with proper documentation.`
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
                Legal Document
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Effective January 2026</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-black dark:text-white tracking-tight leading-tight">
              Terms of Service
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
              SeekEngine is a grounded research system for hybrid search and synthesis. These terms govern your use. We prioritize accuracy over eloquence—when we cannot verify something, we remain silent.
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
            These Terms of Service were last updated in January 2026. We reserve the right to modify these terms at any time. Continued use of SeekEngine following any changes constitutes your acceptance of the new terms.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            For questions about these terms, please contact us through our website. For privacy concerns, see our <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
