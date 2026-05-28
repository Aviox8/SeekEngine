import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-foreground/10 bg-foreground/[0.06] text-foreground/70 hover:bg-foreground/[0.08]',
        secondary: 'border-foreground/[0.06] bg-foreground/[0.03] text-foreground/60 hover:bg-foreground/[0.05]',
        outline: 'border-foreground/10 bg-transparent text-foreground/60 hover:bg-foreground/[0.04]',
        success: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400',
        warning: 'border-amber-500/20 bg-amber-500/[0.08] text-amber-600 dark:text-amber-400',
        error: 'border-red-500/20 bg-red-500/[0.08] text-red-600 dark:text-red-400',
        info: 'border-blue-500/20 bg-blue-500/[0.08] text-blue-600 dark:text-blue-400',
        purple: 'border-violet-500/20 bg-violet-500/[0.08] text-violet-600 dark:text-violet-400',
        cyan: 'border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-600 dark:text-cyan-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
