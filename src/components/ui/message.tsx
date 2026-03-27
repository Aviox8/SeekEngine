'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Sparkles, User, Bot, CornerDownRight } from "lucide-react"

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  role: 'user' | 'assistant'
  isStreaming?: boolean
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, role, isStreaming, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex w-full gap-4 py-6 first:pt-0",
          className
        )}
        {...props}
      >
        <div className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border shadow-sm",
          role === 'user' 
            ? "bg-background border-border text-foreground" 
            : "bg-primary/10 border-primary/20 text-primary"
        )}>
          {role === 'user' ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {role === 'user' ? 'Gaurav' : 'SeekEngine'}
            </span>
            {role === 'assistant' && (
              <div className="flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-primary/40" />
                <span className="text-[10px] font-medium text-primary/60 uppercase tracking-tight">AI Agent</span>
              </div>
            )}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 ml-1"
              >
                <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-primary/40 font-medium">Processing...</span>
              </motion.div>
            )}
          </div>
          <div className="prose prose-zinc dark:prose-invert max-w-none text-[15px] leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Message.displayName = "Message"

const MessageContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-foreground/90 leading-7", className)}
      {...props}
    />
  )
)
MessageContent.displayName = "MessageContent"

export { Message, MessageContent }
