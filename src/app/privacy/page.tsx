'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function PrivacyPolicy() {
  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect the following categories of information: (a) Query Data: Your search queries are logged server-side and anonymized after processing. We retain aggregated patterns for research into grounding mechanisms, not individual query content; (b) Session Data: IP address (hashed after request), browser type, device type, and approximate geographic location for analytics only; (c) Interaction Patterns: Time spent on results, which results were clicked, for understanding system effectiveness; (d) System Metrics: Latency, retrieval success rates, inference times—operational data to improve the grounding pipeline. All sensitive data (API responses with PII, credentials) is purged immediately after processing. Client-side data collection is deliberately minimal to enforce zero-trust boundaries.`
    },
    {
      title: '2. How We Use Your Information',
      content: `We use collected information for: (a) Service Delivery: Processing searches, generating results, and routing requests across models; (b) Infrastructure Monitoring: Detecting abuse, rate limiting, and system health tracking; (c) Analytics: Understanding usage patterns, popular queries, and feature adoption; (d) Model Training: Aggregate performance analysis and quality improvements (with anonymization); (e) Legal Compliance: Responding to valid legal requests and maintaining audit trails; (f) Fraud Prevention: Detecting and mitigating abuse, bot activity, and malicious usage.`
    },
    {
      title: '3. Data Processing & Third Parties',
      content: `Your queries are processed through Google Custom Search and OpenRouter's LLM infrastructure. These services have their own privacy policies, which apply to data they process. We do not control their practices. Additionally, web sources indexed by search engines may collect data when you visit them. Third-party analytics (if enabled) may track aggregate usage patterns. We share data only when legally required or with service providers bound by confidentiality agreements.`
    },
    {
      title: '4. Data Retention',
      content: `Query logs are retained for up to 90 days for abuse detection and model improvement. Anonymized analytics are retained indefinitely. IP addresses are rotated and not stored long-term. Error logs and diagnostic data are retained for 30 days. You can request deletion of your query history by contacting us, though we may retain aggregated insights. We retain data longer if legally required.`
    },
    {
      title: '5. Data Security',
      content: `We implement industry-standard security measures including HTTPS encryption for all communications, request validation via Zod schemas, rate limiting and bot detection, regular security audits, and access controls for internal systems. However, no system is 100% secure. We cannot guarantee absolute protection against sophisticated attacks. Report security vulnerabilities to us immediately rather than publicly disclosing them.`
    },
    {
      title: '6. Your Privacy Rights',
      content: `Depending on your jurisdiction, you may have rights including: (a) Access: Request a copy of data we hold about you; (b) Correction: Request corrections to inaccurate data; (c) Deletion: Request deletion of your data (within legal limits); (d) Portability: Request your data in machine-readable format; (e) Opt-Out: Opt out of analytics and certain data processing. To exercise these rights, contact us with your request. We will respond within 30 days or provide reasons for delay.`
    },
    {
      title: '7. GDPR & Data Subject Rights (EU Users)',
      content: `If you are in the EU, GDPR provides specific rights: Legal Basis for Processing is either your explicit consent to our service or our legitimate interest in service delivery and fraud prevention. You have the right to lodge a complaint with your local data protection authority. Data Processing Agreements are available for organizations upon request. Your data controller is the SeekEngine operator. Cross-border transfers (e.g., to US-based services) rely on standard contractual clauses and adequacy determinations.`
    },
    {
      title: '8. CCPA & California Residents',
      content: `California residents have rights under CCPA to know, delete, and opt-out of data sales. While we do not sell personal information, CCPA may classify our practices broadly. You may submit requests via our contact information. We will not discriminate against you for exercising CCPA rights. The CCPA grants rights including access to specific data collected, confirmation of collection practices, deletion requests (with limited exceptions), and opting-out of "sales" (broadly defined).`
    },
    {
      title: '9. Cookies & Tracking',
      content: `We use minimal tracking. Session cookies (if any) are necessary for service functionality. Persistent cookies are not used without consent. Third-party analytics services may place cookies for analytics purposes. You can disable cookies in your browser settings, though this may limit functionality. We do not track across unrelated websites. Pixel tracking or web beacons are not used on our platform.`
    },
    {
      title: '10. User-Generated Content',
      content: `Any queries you submit may be used for service improvement, research, and analytics in anonymized form. While we do not store personally identifiable information alongside queries, highly specific or sensitive queries may inadvertently contain PII. We recommend avoiding entering sensitive personal data directly into searches. If your query is logged with sensitive information, you can request its deletion.`
    },
    {
      title: '11. Children\'s Privacy',
      content: `SeekEngine is not directed to children under 13. We do not knowingly collect data from children under 13. If we become aware that a child under 13 has provided information, we will delete it promptly. Parents or guardians concerned about their child's use should contact us. Users between 13-18 should be aware that their data is processed according to this policy, with additional protections under certain laws.`
    },
    {
      title: '12. International Data Transfers',
      content: `SeekEngine infrastructure spans multiple regions. Your data may be transferred to and processed in countries outside your home country. By using the service, you consent to such transfers. We implement safeguards including standard contractual clauses, adequacy determinations where applicable, and consistent security practices across regions. For EU residents, transfers comply with GDPR requirements.`
    },
    {
      title: '13. Service Providers & Data Processors',
      content: `We use third-party services for search (Google), LLM routing (OpenRouter), analytics, hosting, and error monitoring. These processors are contractually bound to protect your data and comply with this privacy policy. The processors are: Google (search indexing), OpenRouter (LLM hosting), and hosting infrastructure providers. Contact us for a full list and data processing agreements.`
    },
    {
      title: '14. Policy Changes & Notifications',
      content: `We may update this policy periodically. Material changes will be notified via website announcement or email (if applicable). Continued use after changes indicates acceptance. This policy was last updated in January 2026. Check this page regularly for updates. If you disagree with any changes, discontinue service use.`
    },
    {
      title: '15. Contact & Data Subject Rights Requests',
      content: `For privacy inquiries, data subject rights requests, or concerns about our practices, contact us through the contact information on our website. Requests should include: (a) Your identity verification; (b) Clear description of your request; (c) Preferred response method. We will respond within 30 days or provide reasons for any delay. For unresolved concerns, you have the right to lodge a complaint with the relevant data protection authority.`
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
                Privacy & Legal
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Effective January 2026</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-black dark:text-white tracking-tight leading-tight">
              Privacy Policy
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
              SeekEngine is built on zero-trust principles. We minimize data collection, process queries server-side only, and treat all external input as potentially adversarial. Your data supports grounding research; it is not sold or shared except as legally required.
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
              Questions About Your Privacy?
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This policy explains how SeekEngine collects and protects your data. If you have specific privacy concerns or wish to exercise your data rights, please contact us through our website. We take your privacy seriously and will respond to legitimate requests within 30 days.
            </p>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            For questions about our practices, see our <Link href="/tos" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">Terms of Service</Link>. Last updated: January 2026.
          </p>
        </motion.div>
      </div>
    </main>
  )
}
