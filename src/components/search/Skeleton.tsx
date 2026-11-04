/**
 * Skeleton loading components — Apple-style clean design
 */

export function SkeletonLine({ width = '100%', height = 'h-4', className = '' }: { width?: string; height?: string; className?: string }) {
  return (
    <div
      className={`${height} rounded-full animate-pulse bg-foreground/[0.04] dark:bg-foreground/[0.06] ${className}`}
      style={{ width }}
    />
  )
}

export function AnswerSkeleton() {
  return (
    <div className="space-y-4 py-2" aria-hidden="true">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-foreground/20 animate-pulse" />
        <SkeletonLine width="100px" height="h-3" />
      </div>
      <div className="space-y-3">
        <SkeletonLine width="100%" />
        <SkeletonLine width="95%" />
        <SkeletonLine width="88%" />
        <SkeletonLine width="70%" />
      </div>
    </div>
  )
}

export function ResultCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-foreground/[0.04] bg-foreground/[0.01] dark:bg-foreground/[0.02]" aria-hidden="true">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full animate-pulse bg-foreground/[0.06]" />
          <SkeletonLine width="100px" height="h-3" />
          <div className="ml-auto w-3.5 h-3.5 rounded-full animate-pulse bg-foreground/[0.04]" />
        </div>
        <SkeletonLine width="85%" height="h-5" />
        <div className="space-y-2">
          <SkeletonLine width="100%" height="h-3" />
          <SkeletonLine width="92%" height="h-3" />
        </div>
      </div>
    </div>
  )
}
