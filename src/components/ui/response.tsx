'use client'

import * as React from "react"
import ReactMarkdown, { Components } from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: string
  isStreaming?: boolean
}

type MarkdownCodeProps = React.ComponentPropsWithoutRef<'code'> & {
  inline?: boolean
}

/**
 * Response Component
 * Inspired by ElevenLabs UI (ui.elevenlabs.io)
 * Features: Smoothed markdown streaming, refined typography, layout-aware spacing
 * Responsive: Fluid text sizes that scale naturally from 320px to 1440px
 */
const Response = React.forwardRef<HTMLDivElement, ResponseProps>(
  ({ className, children, isStreaming, ...props }, ref) => {
    
    // PERFORMANCE: Memoize markdown components to avoid recreation during stream
    const markdownComponents = React.useMemo<Components>(() => ({
      h1: (props) => <h1 className="mt-6 mb-3 text-lg font-bold tracking-tight text-foreground first:mt-0 sm:mt-8 sm:mb-4 sm:text-xl md:text-2xl" {...props} />,
      h2: (props) => <h2 className="mt-6 mb-2.5 text-base font-bold tracking-tight text-foreground first:mt-0 sm:mt-8 sm:mb-3 sm:text-lg md:text-xl" {...props} />,
      h3: (props) => <h3 className="mt-5 mb-2 text-sm font-semibold text-foreground/90 first:mt-0 sm:mt-6 sm:mb-3 sm:text-base md:text-lg" {...props} />,
      p: (props) => <p className="mb-3 text-[14px] leading-relaxed text-foreground/80 last:mb-0 sm:mb-4 sm:text-[15px] md:text-base" {...props} />,
      a: ({ href, children }) => (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline underline-offset-4 decoration-primary/30 hover:decoration-primary focus-visible:decoration-primary transition-colors text-primary break-words"
        >
          {children}
        </a>
      ),
      code: ({ inline, className, children, ...props }: MarkdownCodeProps) => {
        return !inline ? (
          <div 
            className="my-4 overflow-hidden rounded-lg bg-foreground/[0.04] p-2.5 font-mono text-[11px] sm:my-6 sm:rounded-xl sm:p-4 sm:text-xs md:text-sm"
          >
            <code className={cn(className, "block overflow-x-auto")} {...props}>
              {children}
            </code>
          </div>
        ) : (
          <code
            className="rounded bg-primary/5 px-1 py-0.5 font-mono text-[11px] text-primary sm:rounded-md sm:px-1.5 sm:text-[12px] md:text-[13px]"
            {...props}
          >
            {children}
          </code>
        )
      },
      ul: (props) => <ul className="flex flex-col gap-2 mb-3 ml-1 list-none sm:gap-3 sm:mb-4" {...props} />,
      li: ({ children }) => (
        <div className="flex items-start gap-2 sm:gap-2.5">
          <span className="mt-[8px] w-1 h-1 rounded-full shrink-0 bg-foreground/30 sm:mt-[9px]" />
          <span className="text-[13px] leading-relaxed text-foreground/85 sm:text-[14px] md:text-[15px]">{children}</span>
        </div>
      ),
      blockquote: (props) => (
        <blockquote className="border-l-2 border-primary/20 pl-3 py-1 my-3 italic text-muted-foreground text-[13px] sm:pl-4 sm:my-4 sm:text-sm" {...props} />
      ),
      strong: (props) => <strong className="font-bold text-foreground" {...props} />,
    }), [])

    return (
      <div ref={ref} className={cn("w-full max-w-none min-w-0", className)} {...props}>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="prose prose-zinc dark:prose-invert max-w-none break-words"
          aria-live="polite"
        >
          <ReactMarkdown 
            components={markdownComponents}
            rehypePlugins={[rehypeSanitize]}
          >
            {isStreaming ? children + '▊' : children}
          </ReactMarkdown>
        </motion.div>
      </div>
    )
  }
)
Response.displayName = "Response"

export { Response }
