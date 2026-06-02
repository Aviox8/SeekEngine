'use client'

/**
 * Navigation Bar — Apple-inspired glassmorphic nav
 * Design: Ultra-clean · subtle glass · refined typography · smooth scroll transitions
 * UX:     prefers-reduced-motion · visible focus rings · proper ARIA · 44px touch targets
 * Motion: Spring-based transitions · clean hover states · scroll-reactive background
 */

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useState, useId, useEffect, useCallback, useRef, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useMotionValueEvent, AnimatePresence, useMotionValue } from 'framer-motion'

/* ─────────────────────────────────────────────────────────────
   Nav Link Icons — Visual hierarchy for mobile menu
───────────────────────────────────────────────────────────── */
const NAV_ICONS: Record<string, React.ReactNode> = {
  Engine: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  About: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  Research: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  Dev: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  ),
}

/* ─────────────────────────────────────────────────────────────
   Apple-style Nav Link — clean hover with subtle underline
───────────────────────────────────────────────────────────── */
function NavLink({ children, href, isActive, external }: {
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
      className={`group relative px-3 py-2 text-[13px] font-medium tracking-[-0.01em] rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 ${
        isActive
          ? 'text-foreground'
          : 'text-foreground/60 hover:text-foreground'
      }`}
    >
      {/* Active indicator — subtle background */}
      {isActive && (
        <motion.div
          layoutId="seekengine-nav-active"
          className="absolute inset-0 rounded-full bg-foreground/[0.08]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Link text */}
      <span className="relative z-10">{children}</span>

      {/* Hover underline — Apple style */}
      <motion.div
        className="absolute bottom-1 left-3 right-3 h-px bg-foreground/30 origin-left"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main Navbar — Apple-inspired design
───────────────────────────────────────────────────────────── */
export default function Navbar() {
  const { setTheme, resolvedTheme } = useTheme()
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileMenuId = useId()
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const [navHeight, setNavHeight] = useState(72)

  // Guard to prevent unnecessary re-renders from scroll events
  const scrolledRef = useRef(false)

  // Motion values for scroll-based effects
  const scrollProgress = useMotionValue(0)

  useMotionValueEvent(scrollY, 'change', (latest) => {
    // Guard: only update state if value actually changed
    const nextScrolled = latest > 20
    if (scrolledRef.current !== nextScrolled) {
      scrolledRef.current = nextScrolled
      setScrolled(nextScrolled)
    }
    // Update scroll progress for motion values (0-120px range for smoother transition)
    scrollProgress.set(Math.min(latest / 120, 1))
  })

  // Measure nav height for dynamic mobile menu positioning
  useEffect(() => {
    if (navRef.current) {
      const height = navRef.current.offsetHeight + 12 // Add padding
      setNavHeight(height)
    }
  }, [])

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

  /* Nav pill styles — Apple Intelligence refined glass with subtle AI glow on scroll */
  const pillClass = scrolled
    ? 'bg-background/80 backdrop-blur-xl border-foreground/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.06)]'
    : 'bg-background/60 backdrop-blur-lg border-foreground/[0.05]'

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col pointer-events-none">
        <div className="flex justify-center px-4 pt-3 pb-2 sm:px-6 sm:pt-4">
          <motion.nav
            ref={navRef}
            id="primary-nav"
            aria-label="Primary navigation"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className={`pointer-events-auto flex w-full max-w-[min(100%,38rem)] items-center justify-between gap-2 rounded-full border px-2 py-1.5 transition-all duration-700 ease-out sm:w-auto sm:max-w-none sm:gap-1 sm:px-2.5 sm:py-1.5 relative ${pillClass}`}
          >
            {/* Subtle AI gradient glow when scrolled — Apple Intelligence style */}
            {scrolled && (
              <div 
                className="absolute -inset-[1px] rounded-full opacity-[0.08] pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b22, #7c3aed22, #0284c722, #05966922)',
                  filter: 'blur(8px)',
                }}
              />
            )}
            {/* ── Logo — refined with subtle scale ── */}
            <Link
              href="/"
              aria-label="SeekEngine — go to homepage"
              className="group relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-300 hover:bg-foreground/[0.04] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2"
            >
              <Image
                src="/logo.png"
                alt=""
                width={26}
                height={26}
                className="h-6.5 w-6.5 transition-transform duration-300 motion-safe:group-hover:scale-105"
                priority
              />
            </Link>

            {/* ── Desktop nav links — Apple-style minimal ── */}
            <div className="hidden sm:flex items-center">
              {navLinks.map((link, i) => {
                const isActive = isLinkActive(link.href, link.external)
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <NavLink href={link.href} isActive={isActive} external={link.external}>
                      {link.label}
                    </NavLink>
                  </motion.div>
                )
              })}
            </div>

            {/* ── Right actions — clean and minimal ── */}
            <div className="flex items-center gap-0.5">
              {/* Keyboard shortcuts hint — opens `?` modal */}
              <motion.button
                type="button"
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }))}
                className="hidden sm:flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-foreground/50 transition-all duration-300 hover:bg-foreground/[0.06] hover:text-foreground active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2"
                aria-label="Show keyboard shortcuts"
                whileTap={{ scale: 0.9 }}
              >
                <kbd className="text-[11px] font-medium text-foreground/50 px-1.5 py-0.5 rounded border border-foreground/[0.08]">?</kbd>
              </motion.button>

              {/* Theme toggle — smooth rotation */}
              <motion.button
                type="button"
                onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-foreground/50 transition-all duration-300 hover:bg-foreground/[0.06] hover:text-foreground active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2"
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                aria-pressed={isDarkMode}
                whileTap={{ rotate: 180, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="relative h-4 w-4 overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{ y: isDarkMode ? 0 : -32 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="flex flex-col items-center gap-4"
                  >
                    {/* Sun */}
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {/* Moon */}
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </motion.div>
                </div>
              </motion.button>

              {/* Mobile hamburger — Apple-style clean */}
              <motion.button
                type="button"
                ref={hamburgerRef}
                onClick={() => setMobileOpen(o => !o)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-foreground/50 transition-all duration-300 hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 sm:hidden"
                aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileOpen}
                aria-controls={mobileMenuId}
                whileTap={{ scale: 0.9 }}
              >
                <motion.svg
                  className="w-[18px] h-[18px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
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
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
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
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      />
                    )}
                  </AnimatePresence>
                </motion.svg>
              </motion.button>
            </div>
          </motion.nav>
        </div>
      </div>

      {/* ── Mobile menu overlay — Apple-style sheet ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop with subtle blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/40 backdrop-blur-xl sm:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Menu panel — refined Apple sheet style */}
            <motion.div
              ref={mobileMenuRef}
              id={mobileMenuId}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              onKeyDown={handleMobileMenuKeyDown}
              className="fixed left-4 right-4 z-50 rounded-3xl border border-foreground/[0.06] bg-background/90 backdrop-blur-2xl p-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.12)] sm:hidden"
              style={{ top: navHeight }}
            >
              <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
                {navLinks.map((link, i) => {
                  const isActive = isLinkActive(link.href, link.external)
                  return (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                      <Link
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 ${
                          isActive
                            ? 'bg-foreground/[0.06] text-foreground'
                            : 'text-foreground/60 hover:text-foreground hover:bg-foreground/[0.04]'
                        }`}
                      >
                        <span className="text-foreground/30">
                          {NAV_ICONS[link.label] || null}
                        </span>
                        {link.label}
                        {link.external && (
                          <svg
                            className="w-3.5 h-3.5 ml-auto opacity-30"
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

              {/* Mobile footer — minimal theme toggle */}
              <div className="mt-1 pt-2 border-t border-foreground/[0.04] px-3 pb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground/30 tracking-wide">
                  Appearance
                </span>
                <motion.button
                  type="button"
                  onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium text-foreground/50 hover:text-foreground hover:bg-foreground/[0.04] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2"
                  aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                  aria-pressed={isDarkMode}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDarkMode ? 'Light mode' : 'Dark mode'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
