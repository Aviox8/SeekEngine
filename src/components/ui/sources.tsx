'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Globe, FileText, ChevronRight } from 'lucide-react';

export interface Source {
  title: string;
  url: string;
  displayUrl?: string;
  snippet?: string;
  favicon?: string;
}

interface SourcesProps extends React.HTMLAttributes<HTMLDivElement> {
  sources: Source[];
  isLoading?: boolean;
}

/**
 * Sources Component
 * Inspired by Vercel AI Elements (elements.ai-sdk.dev/components/sources)
 * Features: Horizontal scrolling list of search grounding sources with glassmorphism
 */
export function Sources({ sources, isLoading, className, ...props }: SourcesProps) {
  if (isLoading) {
    return (
      <div className={cn("flex gap-3 overflow-x-auto pb-4 no-scrollbar", className)} {...props}>
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="flex-shrink-0 w-48 h-[68px] rounded-xl border border-foreground/[0.04] bg-foreground/[0.01] animate-pulse" 
          />
        ))}
      </div>
    );
  }

  if (!sources || sources.length === 0) return null;

  return (
    <div 
      className={cn(
        "group/sources relative w-full",
        className
      )} 
      {...props}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth px-1">
        <AnimatePresence mode="popLayout">
          {sources.map((source, index) => (
            <motion.a
              key={source.url + index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.05,
                ease: [0.16, 1, 0.3, 1] 
              }}
              whileHover={{ y: -2 }}
              className="flex-shrink-0 w-48 p-3 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] hover:bg-foreground/[0.04] hover:border-foreground/[0.1] transition-all group/source"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded shadow-sm bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  {source.favicon ? (
                    <img src={source.favicon} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Globe className="w-2.5 h-2.5 text-muted-foreground" />
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate uppercase tracking-tight">
                  {source.displayUrl || new URL(source.url).hostname.replace('www.', '')}
                </span>
              </div>
              <h4 className="text-[12px] font-semibold text-foreground leading-tight line-clamp-2 min-h-[2em] group-hover/source:text-primary transition-colors">
                {source.title}
              </h4>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Subtle fade edges for horizontal scroll */}
      <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-0 group-hover/sources:opacity-100 transition-opacity" />
    </div>
  );
}
