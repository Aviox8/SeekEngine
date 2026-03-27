import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15',
        secondary: 'border-border bg-muted/50 text-muted-foreground hover:bg-muted/70',
        outline: 'border-border/80 bg-transparent text-muted-foreground hover:border-foreground/30 hover:bg-accent/5',
        success: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/15',
        warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15',
        error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-500/15',
        info: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/15',
        purple: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/15',
        cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/15',
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
