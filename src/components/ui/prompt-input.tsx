'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Sparkles, CornerDownRight, X, Loader2, Search } from "lucide-react"

interface PromptInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSumbit?: (value: string) => void
  isLoading?: boolean
  suggestions?: string[]
}

const PromptInput = React.forwardRef<HTMLTextAreaElement, PromptInputProps>(
  ({ className, value, onChange, onSumbit, isLoading, suggestions, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const [isFocused, setIsFocused] = React.useState(false)

    // Manual merge refs for the textarea
    React.useImperativeHandle(ref, () => textareaRef.current!)

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const target = e.target
      target.style.height = "auto"
      target.style.height = `${Math.min(target.scrollHeight, 200)}px`
      onChange?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (value && onSumbit) onSumbit(value.toString())
      }
    }

    return (
      <div className={cn(
        "relative rounded-2xl border transition-all duration-300",
        isFocused 
          ? "border-primary/30 ring-4 ring-primary/[0.03] bg-background shadow-lg" 
          : "border-foreground/5 bg-foreground/[0.015] dark:bg-foreground/[0.01] shadow-sm",
        className
      )}>
        <div className="flex items-start gap-3 p-4">
          <div className="mt-1 flex-shrink-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <Search className={cn(
                "w-4 h-4 transition-colors duration-300",
                isFocused ? "text-primary/60" : "text-muted-foreground/30"
              )} />
            )}
          </div>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask SeekEngine anything..."
            className="w-full flex-1 bg-transparent border-none focus:ring-0 text-[15px] leading-relaxed resize-none text-foreground placeholder-muted-foreground/30 py-0 min-h-[22px]"
            {...props}
          />

          <div className="flex-shrink-0 flex items-center gap-2">
            <AnimatePresence>
              {value && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => onSumbit?.(value.toString())}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <CornerDownRight className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action bar for suggestions or modes */}
        <div className="border-t border-foreground/[0.03] px-3 py-2 flex items-center justify-between bg-foreground/[0.005]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
             <button className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-foreground/[0.04] transition-colors text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-foreground/70">
                <Sparkles className="w-3 h-3" />
                Search Mode
             </button>
             <div className="w-[1px] h-3 bg-foreground/5" />
             {suggestions?.slice(0, 3).map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => onSumbit?.(s)}
                  className="px-2 py-1 rounded-md hover:bg-foreground/[0.04] transition-colors text-[10px] font-semibold text-muted-foreground/50 hover:text-foreground/70 truncate max-w-[120px]"
                >
                  {s}
                </button>
             ))}
          </div>
          <div className="text-[10px] font-medium text-muted-foreground/30 select-none">
             Type / for command
          </div>
        </div>
      </div>
    )
  }
)
PromptInput.displayName = "PromptInput"

export { PromptInput }
