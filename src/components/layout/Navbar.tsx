'use client'

/**
 * Navigation Bar — Clean floating nav with mobile sheet
 * Features: Collapsible mobile menu, proper touch targets, text-roll hover
 */

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'

/* Text Roll hover effect — character stagger (desktop only) */
function TextRollLink({ children, href, isActive, external }: {
  children: string
  href: string
  isActive: boolean
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={children}
      aria-current={isActive ? "page" : undefined}
      className={`group/roll relative px-3 py-2.5 text-[11px] sm:text-xs font-medium tracking-[0.06em] uppercase rounded-xl transition-colors duration-200 hover:text-foreground`}
    >
      {isActive && (
        <motion.div
          layoutId="seekengine-nav-active"
          className="absolute inset-0 rounded-xl bg-foreground/[0.05] border border-foreground/[0.08]"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10 inline-flex overflow-hidden">
        {/* Default text */}
        <span className="inline-flex transition-transform duration-300 ease-out group-hover/roll:-translate-y-full">
          {children.split('').map((char, i) => (
            <span
              key={i}
              className="inline-block transition-transform duration-300 ease-out"
              style={{ transitionDelay: `${i * 20}ms` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      </span>
      {/* Rolled-up text (clone) — hidden on mobile for perf */}
      <span className="absolute inset-x-3 top-2.5 z-10 hidden sm:inline-flex overflow-hidden pointer-events-none" aria-hidden="true">
        <span className="inline-flex translate-y-full transition-transform duration-300 ease-out group-hover/roll:translate-y-0">
          {children.split('').map((char, i) => (
            <span
              key={i}
              className="inline-block transition-transform duration-300 ease-out"
              style={{ transitionDelay: `${i * 20}ms` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      </span>
    </Link>
  )
}

export default function Navbar() {
  const { setTheme, resolvedTheme } = useTheme()
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    const diff = latest - previous
    if (Math.abs(diff) < 15) return
    const shouldBeVisible = !(latest > previous && latest > 200)
    setVisible(v => (v === shouldBeVisible ? v : shouldBeVisible))
    setScrolled(latest > 20)
  })

  const navLinks = [
    { label: 'Engine', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Research', href: 'https://archduke.is-a.dev/research/seekengine', external: true },
    { label: 'Dev', href: 'https://archduke.is-a.dev/about', external: true },
  ]

  const isDarkMode = resolvedTheme === 'dark'

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col pointer-events-none">
        <div className="flex justify-center px-3 pt-3 pb-2 sm:px-6">
          <motion.nav
            role="navigation"
            aria-label="Primary navigation"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto flex w-full max-w-[min(100%,38rem)] items-center justify-between gap-2 rounded-2xl p-2 transition-all duration-500 sm:w-auto sm:max-w-none sm:gap-1.5 ${
              scrolled ? 'bg-background/80 backdrop-blur-2xl border border-foreground/[0.06] shadow-xl' : 'bg-transparent'
            }`}
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              <Image
                src="/logo.png"
                alt="SeekEngine"
                width={28}
                height={28}
                className="h-7 w-7"
                priority
              />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden sm:flex items-center gap-0.5">
              <div className="h-4 w-[1px] bg-foreground/8 mx-1" />
              {navLinks.map((link) => {
                const isActive = link.external ? false : link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
                return (
                  <TextRollLink
                    key={link.label}
                    href={link.href}
                    isActive={isActive}
                    external={link.external}
                  >
                    {link.label}
                  </TextRollLink>
                )
              })}
              <div className="h-4 w-[1px] bg-foreground/6 mx-1" />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-300 hover:text-foreground active:scale-90"
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                <div className="relative h-4 w-4 overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{ y: isDarkMode ? 0 : -32 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </motion.div>
                </div>
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground sm:hidden"
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                  )}
                </svg>
              </button>
            </div>
          </motion.nav>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm sm:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Menu panel */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[68px] left-3 right-3 z-50 rounded-2xl border border-foreground/[0.08] bg-background/95 backdrop-blur-2xl p-2 shadow-2xl sm:hidden"
            >
              <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
                {navLinks.map((link) => {
                  const isActive = link.external ? false : link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium tracking-wide transition-colors ${
                        isActive
                          ? 'bg-foreground/[0.06] text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]'
                      }`}
                    >
                      {link.label}
                      {link.external && (
                        <svg className="w-3.5 h-3.5 ml-auto opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
