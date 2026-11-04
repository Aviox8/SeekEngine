'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ReactNode } from 'react'
import Link from 'next/link'
import TimelineNumber from './timeline-number'

export type SectionToc = {
  id: string
  label: string
  summary: string
}

export type LegalShellProps = {
  /** 'tos' for the blue color family, 'privacy' for purple, or a custom value. */
  accent: 'tos' | 'privacy'
  badge: string
  badgeMeta?: string
  title: string
  intro: ReactNode
  /** Sticky right-rail table of contents, paired 1:1 with `children`. */
  toc: SectionToc[]
  /** Body sections. Each should be a TimelineNumber or styled block — but any node is fine. */
  children: ReactNode
  /** Optional block rendered between the intro and the sections (e.g. TL;DR tables). */
  tldr?: ReactNode
  /** Closing block, after the sections. */
  closing?: ReactNode
  /** Last-updated date, rendered as a semantic <time>. */
  lastUpdated: string
}

const ACCENTS = {
  tos: {
    chip: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    bullet: 'bg-blue-500',
    link: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  privacy: {
    chip: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    bullet: 'bg-purple-500',
    link: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
} as const

export default function LegalPageShell({
  accent,
  badge,
  badgeMeta,
  title,
  intro,
  toc,
  children,
  tldr,
  closing,
  lastUpdated,
}: LegalShellProps) {
  const styles = ACCENTS[accent]
  const reducedMotion = useReducedMotion()
  const isFirstRender = reducedMotion === null
  const animate = !isFirstRender && reducedMotion === false

  return (
    <main className="relative min-h-screen bg-background pt-20 pb-24 font-sans transition-colors duration-700 sm:pt-24 sm:pb-40">
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6">

        {/* ── HEADER ──────────────────────────────────────────── */}
        <motion.header
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.7 }}
          className="mb-12 border-b border-foreground/[0.07] pb-10 sm:mb-16 sm:pb-12"
        >
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${styles.chip}`}>
                {badge}
              </span>
              {badgeMeta && (
                <span className="text-[10px] font-bold text-foreground/35 uppercase tracking-wider">
                  {badgeMeta}
                </span>
              )}
            </div>

            <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.95] tracking-[-0.025em] text-foreground">
              {title}
            </h1>

            <p className="text-prose text-foreground/65 text-[15px] sm:text-base max-w-2xl">
              {intro}
            </p>

            <p className="text-[11px] text-foreground/35 tracking-wide pt-1">
              Last updated{' '}
              <time dateTime={lastUpdated} className="text-foreground/55 font-medium">
                {new Date(lastUpdated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {' · '}
              <Link href="/about" className={`${styles.link} hover:underline focus-visible:underline font-medium`}>
                ← Back to About
              </Link>
            </p>
          </div>
        </motion.header>

        {/* ── BODY GRID: TOC + SECTIONS ───────────────────────── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[14rem_1fr] lg:gap-14">

          {/* Sticky TOC on desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/35 mb-4">
                On this page
              </p>
              <nav aria-label="Page contents">
                <ol className="space-y-1.5 border-l border-foreground/[0.08]">
                  {toc.map((item, idx) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="group flex items-start gap-2 -ml-px pl-3 py-1 text-[12px] leading-snug text-foreground/50 hover:text-foreground focus-visible:text-foreground transition-colors border-l border-transparent hover:border-foreground/40"
                      >
                        <span className="text-foreground/30 tabular-nums shrink-0 mt-px">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="group-hover:underline underline-offset-2 decoration-foreground/20">
                          {item.label}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </aside>

          {/* Sections */}
          <div className="min-w-0">
            {tldr && (
              <motion.div
                initial={animate ? { opacity: 0, y: 8 } : false}
                animate={animate ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-12 sm:mb-16"
              >
                {tldr}
              </motion.div>
            )}

            <div className="space-y-8 sm:space-y-10">
              {children}
            </div>

            {closing && (
              <motion.div
                initial={animate ? { opacity: 0 } : false}
                whileInView={animate ? { opacity: 1 } : undefined}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-16 space-y-6 border-t border-foreground/[0.07] pt-10 sm:mt-20 sm:pt-12"
              >
                {closing}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

/**
 * Convenience wrapper for a single legal section.
 * Renders TimelineNumber with the right tone + injects an `id` for in-page anchors.
 */
export function LegalSection({
  id,
  index,
  total,
  tone,
  title,
  summary,
  children,
}: {
  id: string
  index: number
  total: number
  tone: 'blue' | 'purple'
  title: string
  summary?: string
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <TimelineNumber index={index} total={total} tone={tone}>
        <h2
          id={`${id}-title`}
          className="text-lg sm:text-xl font-semibold tracking-tight text-foreground mb-2"
        >
          {title}
        </h2>
        {summary && (
          <p className="text-[13px] sm:text-sm font-medium text-foreground/50 mb-3 leading-relaxed">
            {summary}
          </p>
        )}
        <div className="text-prose-tight">{children}</div>
      </TimelineNumber>
    </section>
  )
}
