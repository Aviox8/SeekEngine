import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[13px] font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] active:duration-100',
  {
    variants: {
      variant: {
        default: 'bg-foreground text-background shadow-sm hover:shadow-md hover:brightness-110 active:shadow-sm',
        secondary: 'bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1] active:bg-foreground/[0.08]',
        destructive: 'bg-red-500 text-white shadow-sm hover:shadow-md hover:brightness-110 active:shadow-sm',
        outline: 'border border-foreground/10 bg-transparent text-foreground hover:bg-foreground/[0.04] hover:border-foreground/15 active:bg-foreground/[0.06]',
        ghost: 'text-foreground hover:bg-foreground/[0.06] active:bg-foreground/[0.08]',
        glow: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm hover:shadow-md hover:brightness-110 dark:from-violet-500 dark:to-indigo-500',
        success: 'bg-emerald-500 text-white shadow-sm hover:shadow-md hover:brightness-110 active:shadow-sm',
      } as const,
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-full px-4 text-xs',
        lg: 'h-12 rounded-full px-6 text-sm',
        xl: 'h-14 rounded-full px-8 text-base',
        icon: 'h-10 w-10 rounded-full',
        icon_sm: 'h-8 w-8 rounded-full',
      } as const,
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
