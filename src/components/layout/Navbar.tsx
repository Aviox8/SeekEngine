'use client'

/**
 * Navigation Bar — Creative B&W with Rolling Text Banner
 * Inspired by speakeasy.com + cosmos.so + fiddle.digital
 * Features: Rolling text marquee, text-roll hover, floating nav
 */

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'

/* Text Roll hover effect — character stagger */
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
      className={`group/roll relative px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-medium tracking-[0.08em] uppercase rounded-xl overflow-hidden`}
    >
      {isActive && (
        <motion.div
          layoutId="seekengine-nav-active"
          className="absolute inset-0 rounded-xl bg-foreground/[0.04] border border-foreground/[0.06]"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      {/* Default text */}
      <span className="relative z-10 flex overflow-hidden h-[1.2em]">
        <span className="flex transition-transform duration-300 ease-out group-hover/roll:-translate-y-full">
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
      {/* Rolled-up text (clone) */}
      <span className="absolute left-3 sm:left-4 right-3 sm:right-4 z-10 flex overflow-hidden h-[1.2em]" aria-hidden="true">
        <span className="flex translate-y-full transition-transform duration-300 ease-out group-hover/roll:translate-y-0">
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
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    const diff = latest - previous
    if (Math.abs(diff) < 5) return
    const shouldBeVisible = !(latest > previous && latest > 200)
    setVisible(v => (v === shouldBeVisible ? v : shouldBeVisible))
    setScrolled(latest > 20)
  })

  useEffect(() => { setMounted(true) }, [])

  const navLinks = [
    { label: 'Engine', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Research', href: 'https://archduke.is-a.dev/research/seekengine', external: true },
    { label: 'Dev', href: 'https://archduke.is-a.dev/about', external: true },
  ]

  if (!mounted) {
    return <div className="fixed top-0 left-0 right-0 h-12 pointer-events-none" />
  }

  const isDarkMode = resolvedTheme === 'dark'

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col pointer-events-none">
      {/* Main navigation */}
      <div className="flex justify-center px-4 sm:px-8 pt-3 pb-2">
        <motion.nav
          role="navigation"
          aria-label="Primary navigation"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-2xl pointer-events-auto transition-all duration-700 ${scrolled ? 'bg-background/60 backdrop-blur-2xl border border-foreground/[0.04] shadow-2xl' : 'bg-transparent'}`}
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden ml-0.5 sm:ml-1 flex-shrink-0 hover:scale-105 active:scale-95 transition-transform duration-300"
          >
            <Image
              src="/logo.png"
              alt="SeekEngine"
              width={28}
              height={28}
              className="w-7 h-7 sm:w-8 sm:h-8"
              priority
            />
          </Link>

          {/* Separator */}
          <div className="w-[1px] h-4 mx-1.5 bg-foreground/6" />

          {/* Nav Items with text-roll hover */}
          <div className="flex items-center relative gap-0.5 sm:gap-1 px-1">
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
          </div>

          {/* Separator */}
          <div className="w-[1px] h-4 mx-1.5 bg-foreground/6" />

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl active:scale-90 transition-all duration-300 text-muted-foreground hover:text-foreground mr-0.5 sm:mr-1"
            aria-label="Toggle theme"
          >
            <div className="relative w-4 h-4 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ y: isDarkMode ? 0 : -32 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="flex flex-col gap-4 items-center"
              >
                {/* Sun */}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {/* Moon */}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </motion.div>
            </div>
          </button>
        </motion.nav>
      </div>
    </div>
  )
}
