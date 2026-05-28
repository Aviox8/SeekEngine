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
        <span className="text-[100px] sm:text-[140px] font-bold tracking-tighter leading-none text-foreground/[0.04] select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2.5">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
              Page Not Found
            </h2>
            <p className="text-sm text-muted-foreground/60 max-w-[280px] leading-relaxed">
              This node doesn&apos;t exist in the search index.
            </p>
          </div>
        </div>
      </div>
      
      <Link 
        href="/" 
        className="mt-2 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-85 transition-opacity active:scale-95"
      >
        Return to Engine
      </Link>
    </div>
  )
}
