'use client'

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found | SeekEngine',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 bg-background transition-colors">
      {/* Error code */}
      <div className="relative">
        <span className="text-[100px] sm:text-[140px] font-bold tracking-tighter leading-none text-foreground/[0.03] select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
              Page Not Found
            </h2>
            <p className="text-sm text-foreground/40 max-w-[280px] leading-relaxed font-light">
              This page doesn&apos;t exist or has been moved.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-85 transition-opacity active:scale-95"
        >
          Return to Engine
        </Link>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back()
            }
          }}
          className="px-6 py-2.5 rounded-full border border-foreground/10 text-foreground/70 text-sm font-medium hover:border-foreground/20 hover:text-foreground transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
          aria-label="Go back to the previous page"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}
