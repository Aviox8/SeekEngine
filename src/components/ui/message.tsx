'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"
import LivingIcon from "../shared/LivingIcon"

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
        <motion.div 
          className={cn(
            "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border",
            role === 'user' 
              ? "bg-foreground/[0.04] border-foreground/[0.08] text-foreground" 
              : "bg-foreground/[0.06] border-foreground/[0.08] text-foreground/70"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {role === 'user' ? (
            <User className="h-4 w-4" />
          ) : (
            <LivingIcon size="w-4 h-4" color="#6F6F6F" />
          )}
        </motion.div>
        <motion.div 
          className="flex-1 space-y-2 overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-foreground/40">
              {role === 'user' ? 'You' : 'SeekEngine'}
            </span>
            {role === 'assistant' && (
              <motion.div 
                className="flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div 
                  className="h-1.5 w-1.5 rounded-full bg-foreground/30"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <span className="text-[10px] font-medium text-foreground/40">AI</span>
              </motion.div>
            )}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 ml-1"
              >
                <motion.span 
                  className="h-1 w-1 rounded-full bg-foreground/40"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <span className="text-[10px] text-foreground/30 font-medium">Thinking</span>
              </motion.div>
            )}
          </div>
          <motion.div 
            className="prose prose-zinc dark:prose-invert max-w-none text-[15px] leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            {children}
          </motion.div>
        </motion.div>
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
