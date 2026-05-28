'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { CornerDownRight, X, Loader2, Search } from "lucide-react"
import LivingIcon from "../shared/LivingIcon"

interface PromptInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSearch?: (value: string) => void
  isLoading?: boolean
  suggestions?: string[]
}

const PromptInput = React.forwardRef<HTMLTextAreaElement, PromptInputProps>(
  ({ className, value, onChange, onSearch, isLoading, suggestions, ...props }, ref) => {
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
        if (value && onSearch) onSearch(value.toString())
      }
    }

    return (
      <motion.div 
        className={cn(
          "relative rounded-2xl border transition-all duration-300",
          isFocused 
            ? "border-primary/40 ring-4 ring-primary/10 bg-background shadow-lg" 
            : "border-foreground/8 bg-foreground/[0.02] shadow-sm hover:border-foreground/12",
          className
        )}
        animate={{ boxShadow: isFocused ? "0 0 20px rgba(59, 130, 246, 0.1)" : "0 1px 3px rgba(0, 0, 0, 0.1)" }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start gap-3 p-4">
          <motion.div 
            className="mt-1 flex-shrink-0"
            animate={{ color: isFocused ? 'rgb(59, 130, 246)' : 'rgb(100, 100, 100)' }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </motion.div>
          
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask SeekEngine anything..."
            className="w-full flex-1 bg-transparent border-none focus:ring-0 text-[15px] leading-relaxed resize-none text-foreground placeholder-muted-foreground/40 py-0 min-h-[22px]"
            {...props}
          />

          <div className="flex-shrink-0 flex items-center gap-2">
            <AnimatePresence>
              {value && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSearch?.(value.toString())}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:shadow-lg transition-all"
                >
                  <CornerDownRight className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action bar for suggestions or modes */}
        <motion.div 
          className="border-t border-foreground/[0.05] px-3 py-2 flex items-center justify-between bg-foreground/[0.01]"
          animate={{ opacity: isFocused ? 1 : 0.7 }}
        >
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
             <motion.button 
               whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
               className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-foreground/70"
             >
                <LivingIcon size="w-3 h-3" color="#6F6F6F" />
                Search
             </motion.button>
             <div className="w-[1px] h-3 bg-foreground/10" />
             {suggestions?.slice(0, 3).map((s, idx) => (
                <motion.button 
                  key={idx}
                  onClick={() => onSearch?.(s)}
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
                  whileTap={{ scale: 0.95 }}
                  className="px-2 py-1 rounded-md transition-colors text-[10px] font-semibold text-muted-foreground/60 hover:text-foreground/70 truncate max-w-[120px]"
                >
                  {s}
                </motion.button>
             ))}
          </div>
          <motion.div 
            className="text-[10px] font-medium text-muted-foreground/40 select-none"
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
             ⌘ + /
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }
)
PromptInput.displayName = "PromptInput"

export { PromptInput }
