import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] active:duration-100',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:brightness-110 dark:hover:brightness-125 active:shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:bg-secondary/80 active:shadow-none',
        destructive: 'bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:brightness-110 active:shadow-sm',
        outline: 'border-2 border-border bg-transparent text-foreground hover:bg-accent/5 hover:border-accent/50 active:bg-accent/10',
        ghost: 'text-foreground hover:bg-accent/10 hover:text-foreground/80 active:bg-accent/20',
        glow: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:brightness-110 dark:from-violet-500 dark:to-indigo-500',
        success: 'bg-green-600 text-white shadow-md hover:shadow-lg hover:brightness-110 active:shadow-sm',
      } as const,
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs font-medium',
        lg: 'h-12 rounded-lg px-6 text-base',
        xl: 'h-14 rounded-xl px-8 text-lg font-bold',
        icon: 'h-10 w-10 rounded-lg',
        icon_sm: 'h-8 w-8 rounded-md',
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
