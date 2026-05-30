'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

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

// Utility to safely extract hostname for display
function getSafeDisplayUrl(url: string, displayUrl?: string): string {
  if (displayUrl) return displayUrl;
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return hostname;
  } catch {
    return 'Source';
  }
}

/**
 * Sources Component
 * Inspired by Vercel AI Elements (elements.ai-sdk.dev/components/sources)
 * Features: Horizontal scrolling list of search grounding sources with glassmorphism,
 * favicon error handling, and accessibility improvements
 */
export function Sources({ sources, isLoading, className, ...props }: SourcesProps) {
  const [faviconErrors, setFaviconErrors] = useState<Set<string>>(new Set());
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleFaviconError = (url: string) => {
    setFaviconErrors(prev => new Set([...prev, url]));
  };

  if (!sources || sources.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div 
        className={cn("flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-foreground/20 scrollbar-track-transparent", className)} 
        role="status"
        aria-label="Loading sources"
        {...props}
      >
        {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[60px] w-36 flex-shrink-0 animate-pulse rounded-lg border border-foreground/[0.04] bg-foreground/[0.01] sm:h-[68px] sm:w-48 sm:rounded-xl"
            />
          ))}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group/sources relative w-full",
        className
      )} 
      role="region"
      aria-label="Sources and references"
      {...props}
    >
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-foreground/20 scrollbar-track-transparent scroll-smooth snap-x snap-mandatory py-1"
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
      >
        <AnimatePresence mode="popLayout">
          {sources.map((source, index) => {
            const displayUrl = getSafeDisplayUrl(source.url, source.displayUrl);
            const faviconFailed = faviconErrors.has(source.url);
            
            return (
              <motion.a
                key={source.url + index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.06,
                  ease: [0.16, 1, 0.3, 1] 
                }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group/source snap-start flex w-36 flex-shrink-0 rounded-2xl border border-foreground/[0.04] bg-foreground/[0.02] p-2.5 transition-all hover:border-foreground/[0.08] hover:bg-foreground/[0.04] hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-48 sm:p-3 sm:snap-center"
                aria-label={`${source.title} - ${displayUrl}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded shadow-sm bg-card flex items-center justify-center overflow-hidden shrink-0">
                    {source.favicon && !faviconFailed ? (
                      <Image 
                        src={source.favicon} 
                        alt="" 
                        width={16}
                        height={16}
                        className="w-full h-full object-contain"
                        unoptimized
                        onError={() => handleFaviconError(source.url)}
                      />
                    ) : (
                      <Globe className="w-2.5 h-2.5 text-muted-foreground" aria-hidden="true" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground truncate uppercase tracking-tight">
                    {displayUrl}
                  </span>
                </div>
                <h4 className="text-[12px] font-semibold text-foreground leading-tight line-clamp-2 min-h-[2em] group-hover/source:text-primary transition-colors duration-300">
                  {source.title || 'Untitled'}
                </h4>
              </motion.a>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Subtle fade edges for horizontal scroll - positioned above scrollbar */}
      <div 
        className="absolute top-0 right-0 h-[calc(100%-16px)] w-12 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-0 group-hover/sources:opacity-100 transition-opacity" 
        aria-hidden="true"
      />
    </div>
  );
}
