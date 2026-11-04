'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

type Tone = 'blue' | 'purple' | 'neutral'

const TONE_STYLES: Record<Tone, string> = {
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
  neutral: 'bg-gradient-to-br from-foreground/80 to-foreground',
}

interface TimelineNumberProps {
  index: number
  total: number
  tone?: Tone
  children: ReactNode
  className?: string
}

export default function TimelineNumber({
  index,
  total,
  tone = 'blue',
  children,
  className = '',
}: TimelineNumberProps) {
  const isLast = index === total - 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      viewport={{ once: true, margin: '-100px' }}
      className={`group ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <div className="relative shrink-0">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl sm:sticky sm:top-24 sm:h-10 sm:w-10 ${TONE_STYLES[tone]}`}
          >
            <span className="text-xs font-black text-white">
              {index + 1}
            </span>
          </div>
          {!isLast && (
            <div
              className={`absolute left-4 top-10 hidden h-20 w-0.5 bg-gradient-to-b ${
                tone === 'purple' ? 'from-purple-500' : tone === 'blue' ? 'from-blue-500' : 'from-foreground/40'
              } to-transparent opacity-30 transition-opacity group-hover:opacity-50 group-focus-visible:opacity-50 sm:block`}
            />
          )}
        </div>

        <div className="flex-1 min-w-0 pb-8 prose-timeline">
          {children}
        </div>
      </div>
    </motion.div>
  )
}
