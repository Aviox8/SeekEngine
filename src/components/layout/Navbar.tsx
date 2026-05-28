'use client'

/**
 * Navigation Bar — Floating glassmorphic pill nav
 * Design: Always-visible subtle pill · heavier glass on scroll · layered elevation
 * UX:     prefers-reduced-motion · visible focus rings · proper ARIA · 44px touch targets
 * Motion: Staggered entrance · text-roll hover (desktop) · spring hide/show on scroll
 */

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useState, useId, useEffect, useCallback, useRef, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'

/* ─────────────────────────────────────────────────────────────
   Text Roll hover — character-staggered reveal (desktop only)
   Disabled automatically via CSS when prefers-reduced-motion
───────────────────────────────────────────────────────────── */
function TextRollLink({ children, href, isActive, external }: {
  children: string
  href: string
  isActive: boolean
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-label={external ? `${children} (opens in new tab)` : children}
      aria-current={isActive ? 'page' : undefined}
      className={`group/roll relative px-3 py-2.5 text-[11px] sm:text-xs font-semibold tracking-[0.07em] uppercase rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-1 ${
        isActive
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {/* Active pill indicator — shared layout animation */}
      {isActive && (
        <motion.div
          layoutId="seekengine-nav-active"
          className="absolute inset-0 rounded-xl bg-foreground/[0.1] border border-foreground/[0.12]"
          transition={{ type: 'spring', bounce: 0.18, duration: 0.55 }}
        />
      )}

      {/* Default visible text */}
      <span className="relative z-10 inline-flex overflow-hidden h-[1em]">
        <span className="inline-flex motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover/roll:-translate-y-full">
          {children.split('').map((char, i) => (
            <span
              key={i}
              className="inline-block motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
              style={{ transitionDelay: `${i * 18}ms` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      </span>

      {/* Rolled-up clone — desktop only, aria-hidden */}
      <span
        className="absolute inset-x-3 top-2.5 z-10 hidden sm:inline-flex overflow-hidden h-[1em] pointer-events-none"
        aria-hidden="true"
      >
        <span className="inline-flex motion-safe:translate-y-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover/roll:translate-y-0">
          {children.split('').map((char, i) => (
            <span
              key={i}
              className="inline-block motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
              style={{ transitionDelay: `${i * 18}ms` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      </span>
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main Navbar
───────────────────────────────────────────────────────────── */
export default function Navbar() {
  const { setTheme, resolvedTheme } = useTheme()
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileMenuId = useId()
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Guard to prevent unnecessary re-renders from scroll events
  const scrolledRef = useRef(false)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    const diff = latest - previous
    if (Math.abs(diff) < 12) return
    const shouldBeVisible = !(latest > previous && latest > 150)
    setVisible(v => (v === shouldBeVisible ? v : shouldBeVisible))
    // Guard: only update state if value actually changed
    const nextScrolled = latest > 24
    if (scrolledRef.current !== nextScrolled) {
      scrolledRef.current = nextScrolled
      setScrolled(nextScrolled)
    }
  })

  const navLinks = useMemo(() => [
    { label: 'Engine',   href: '/' },
    { label: 'About',    href: '/about' },
    { label: 'Research', href: 'https://archduke.is-a.dev/research/seekengine', external: true },
    { label: 'Dev',      href: 'https://archduke.is-a.dev/about',              external: true },
  ], [])

  const isDarkMode = resolvedTheme === 'dark'

  // Helper to check if a link is active
  const isLinkActive = useCallback((href: string, external?: boolean) => {
    if (external) return false
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }, [pathname])

  // Focus trap for mobile menu
  const handleMobileMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !mobileMenuRef.current) return
    
    const focusableElements = mobileMenuRef.current.querySelectorAll<HTMLElement>(
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      // Focus first item after animation
      const timer = setTimeout(() => {
        const firstLink = mobileMenuRef.current?.querySelector<HTMLElement>('a, button')
        firstLink?.focus()
      }, 100)
      return () => clearTimeout(timer)
    } else {
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
    }
  }, [mobileOpen])

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        e.preventDefault()
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [mobileOpen])

  // Cleanup body scroll on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = '' }
  }, [])

  /* Nav pill styles — 3 states:
     idle     → faint border + near-transparent bg (always readable as a pill)
     scrolled → heavy glass backdrop + stronger border + shadow
  */
  const pillClass = scrolled
    ? 'bg-background/85 backdrop-blur-2xl border-foreground/[0.09] shadow-xl shadow-black/[0.1]'
    : 'bg-background/40 backdrop-blur-md border-foreground/[0.05]'

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col pointer-events-none">
        <div className="flex justify-center px-3 pt-3 pb-2 sm:px-6">
          <motion.nav
            id="primary-nav"
            aria-label="Primary navigation"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto flex w-full max-w-[min(100%,40rem)] items-center justify-between gap-2 rounded-2xl border p-2 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-500 sm:w-auto sm:max-w-none sm:gap-1.5 ${pillClass}`}
          >
            {/* ── Logo ── */}
            <Link
              href="/"
              aria-label="SeekEngine — go to homepage"
              className="group flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl transition-[box-shadow,transform] duration-300 hover:shadow-[0_0_0_2px_hsl(var(--foreground)/0.12)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            >
              <Image
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 transition-transform duration-300 motion-safe:group-hover:scale-105"
                priority
              />
            </Link>

            {/* ── Desktop nav links ── */}
            <div className="hidden sm:flex items-center gap-0.5">
              {/* Decorative separator */}
              <div aria-hidden="true" className="h-4 w-px bg-foreground/[0.07] mx-2" />
              {navLinks.map((link, i) => {
                const isActive = isLinkActive(link.href, link.external)
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <TextRollLink href={link.href} isActive={isActive} external={link.external}>
                      {link.label}
                    </TextRollLink>
                  </motion.div>
                )
              })}
              <div aria-hidden="true" className="h-4 w-px bg-foreground/[0.05] mx-2" />
            </div>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-0.5">
              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-[color,background-color] duration-200 hover:bg-foreground/[0.05] hover:text-foreground active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                aria-pressed={isDarkMode}
              >
                <div className="relative h-4 w-4 overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{ y: isDarkMode ? 0 : -32 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="flex flex-col items-center gap-4"
                  >
                    {/* Sun */}
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {/* Moon */}
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </motion.div>
                </div>
              </button>

              {/* Mobile hamburger */}
              <button
                type="button"
                ref={hamburgerRef}
                onClick={() => setMobileOpen(o => !o)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-[color,background-color] duration-200 hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:hidden"
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
                aria-controls={mobileMenuId}
              >
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {mobileOpen ? (
                      <motion.path
                        key="close"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ pathLength: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    ) : (
                      <motion.path
                        key="open"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 8h16M4 16h16"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ pathLength: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.svg>
              </button>
            </div>
          </motion.nav>
        </div>
      </div>

      {/* ── Mobile menu overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm sm:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Menu panel */}
            <motion.div
              ref={mobileMenuRef}
              id={mobileMenuId}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onKeyDown={handleMobileMenuKeyDown}
              className="fixed top-[72px] left-3 right-3 z-50 rounded-2xl border border-foreground/[0.08] bg-background/96 backdrop-blur-2xl p-2 shadow-2xl shadow-black/[0.12] sm:hidden"
            >
              <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
                {navLinks.map((link, i) => {
                  const isActive = isLinkActive(link.href, link.external)
                  return (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium tracking-wide transition-[color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 ${
                          isActive
                            ? 'bg-foreground/[0.07] text-foreground border border-foreground/[0.08]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
                        }`}
                      >
                        {link.label}
                        {link.external && (
                          <svg
                            className="w-3.5 h-3.5 ml-auto opacity-35"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M7 17L17 7M17 7H7M17 7V17" />
                          </svg>
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              {/* Mobile footer — theme toggle row */}
              <div className="mt-1.5 pt-2 border-t border-foreground/[0.05] px-4 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                  Appearance
                </span>
                <button
                  type="button"
                  onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-[color,background-color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                  aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                  aria-pressed={isDarkMode}
                >
                  {isDarkMode ? 'Light mode' : 'Dark mode'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
