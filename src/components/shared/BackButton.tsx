'use client'

import { useRouter } from 'next/navigation'

/**
 * BackButton — history.back() with a fallback to home if there's no history.
 * Isolated as a client component so the parent page can stay a server component
 * (which is required for `export const metadata`).
 */
export default function BackButton() {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          window.history.back()
        } else if (typeof window !== 'undefined') {
          router.push('/')
        }
      }}
      className="px-6 py-2.5 rounded-full border border-foreground/10 text-foreground/70 text-sm font-medium hover:border-foreground/20 hover:text-foreground transition-[color,border-color,background-color,transform] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
      aria-label="Go back to the previous page"
    >
      Go Back
    </button>
  )
}
