'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SHORTCUT_GROUPS = [
  {
    label: 'Navigation',
    items: [
      { keys: ['/'], description: 'Focus search' },
      { keys: ['Esc'], description: 'Close / blur' },
      { keys: ['?'], description: 'Toggle this overlay' },
    ]
  },
  {
    label: 'Search',
    items: [
      { keys: ['Tab'], description: 'Accept ghost text' },
      { keys: ['↑', '↓'], description: 'Navigate suggestions' },
      { keys: ['Enter'], description: 'Search' },
    ]
  }
]

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !document.activeElement?.matches('input, textarea')) {
      e.preventDefault()
      setOpen(prev => !prev)
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
    }
  }, [open])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Focus trap when modal is open
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Focus the modal after animation
      const timer = setTimeout(() => {
        modalRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [open])

  // Trap focus inside modal
  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return
    
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[200] bg-black/30 dark:bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[201] flex items-center justify-center px-4 pointer-events-none"
          >
            <div 
              ref={modalRef}
              tabIndex={-1}
              onKeyDown={handleModalKeyDown}
              className="pointer-events-auto w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden outline-none"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h8M6 16h.01M10 16h4" />
                  </svg>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close keyboard shortcuts"
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Shortcut Groups */}
              <div className="px-6 pb-5 space-y-4">
                {SHORTCUT_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">{group.label}</p>
                    <div className="space-y-2">
                      {group.items.map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                          <span className="text-sm text-zinc-600 dark:text-zinc-300">
                            {shortcut.description}
                          </span>
                          <div className="flex gap-1">
                            {shortcut.keys.map((key, j) => (
                              <kbd
                                key={j}
                                className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-[11px] font-mono font-medium bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <p className="text-[11px] text-zinc-400 text-center">
                  Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">?</kbd> anywhere to toggle
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
