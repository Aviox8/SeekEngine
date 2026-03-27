'use client'

import * as React from "react"
import ReactMarkdown, { Components } from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface ResponseProps extends React.HTMLAttributes<HTMLDivElement> {
  children: string
  isStreaming?: boolean
}

/**
 * Response Component
 * Inspired by ElevenLabs UI (ui.elevenlabs.io)
 * Features: Smoothed markdown streaming, refined typography, and layout-aware spacing
 */
const Response = React.forwardRef<HTMLDivElement, ResponseProps>(
  ({ className, children, isStreaming, ...props }, ref) => {
    
    // PERFORMANCE: Memoize markdown components to avoid recreation during stream
    const markdownComponents = React.useMemo<Components>(() => ({
      h1: (props) => <h1 className="text-2xl font-bold mt-8 mb-4 tracking-tight text-foreground first:mt-0" {...props} />,
      h2: (props) => <h2 className="text-xl font-bold mt-8 mb-3 tracking-tight text-foreground first:mt-0" {...props} />,
      h3: (props) => <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground/90 first:mt-0" {...props} />,
      p: (props) => <p className="mb-4 last:mb-0 leading-relaxed text-foreground/80" {...props} />,
      a: ({ href, children }) => (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-colors text-primary"
        >
          {children}
        </a>
      ),
      code: ({ inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '')
        return !inline ? (
          <motion.div 
            className="my-6 rounded-xl overflow-hidden border border-foreground/10 bg-foreground/[0.03] p-4 font-mono text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <code className={cn(className, "block overflow-x-auto")} {...props}>
              {children}
            </code>
          </motion.div>
        ) : (
          <motion.code 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-1.5 py-0.5 rounded-md font-mono text-[13px] bg-primary/5 text-primary border border-primary/20"
            {...props}
          >
            {children}
          </motion.code>
        )
      },
      ul: (props) => <ul className="flex flex-col gap-3 mb-4 ml-1 list-none" {...props} />,
      li: ({ children }) => (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3"
        >
          <motion.span 
            className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 bg-primary/50"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
          />
          <span className="text-[15px] leading-relaxed text-foreground/85">{children}</span>
        </motion.div>
      ),
      blockquote: (props) => (
        <blockquote className="border-l-2 border-primary/20 pl-4 py-1 my-4 italic text-muted-foreground" {...props} />
      ),
      strong: (props) => <strong className="font-bold text-foreground" {...props} />,
    }), [])

    return (
      <div className="w-full max-w-none">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="prose prose-zinc dark:prose-invert max-w-none"
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
