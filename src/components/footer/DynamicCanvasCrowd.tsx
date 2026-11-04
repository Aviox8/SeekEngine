'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const CrowdCanvas = dynamic(() => import('./CanvasCrowd'), { ssr: false })

export default function DynamicCanvasCrowd() {
  // prefers-reduced-motion: skip the GSAP canvas and use a static sprite
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduceMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Hydration-safe year — avoid mismatch if SSR timestamp crosses midnight
  const [year, setYear] = useState<number | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear())
  }, [])

  return (
    <footer className="relative w-full overflow-hidden">
      {/* Gradient fade at top */}
      <div
        className="absolute top-0 left-0 right-0 h-24 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, hsl(var(--background)), transparent)`,
        }}
      />

      {/* Canvas crowd animation (skipped for prefers-reduced-motion) */}
      <div className="relative h-[36vh] sm:h-[45vh]">
        {reduceMotion === false && (
          <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
        )}
        {reduceMotion === true && (
          <Image
            src="/images/peeps/all-peeps.png"
            alt=""
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Footer content overlay */}
      <div className="relative z-20 -mt-24 pb-8 sm:-mt-32">
        {/* Gradient fade from canvas to content */}
        <div
          className="h-32 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent, hsl(var(--background)))`,
          }}
        />

        <div className="bg-background px-4 sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
            {/* Logo + brand */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="SeekEngine"
                width={20}
                height={20}
                className="opacity-40 group-hover:opacity-70 group-focus-visible:opacity-70 transition-opacity duration-300"
              />
              <span className="font-display text-sm tracking-tight text-muted-foreground/40 group-hover:text-muted-foreground/60 group-focus-visible:text-muted-foreground/60 transition-colors duration-300">
                SeekEngine
              </span>
            </Link>

            {/* Decorative divider */}
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

            {/* Navigation links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-8">
              {[
                { label: 'About', href: '/about' },
                { label: 'Terms', href: '/tos' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Developer', href: 'https://archduke.is-a.dev/about', external: true },
                { label: 'Source', href: 'https://github.com/archduke1337/SeekEngine', external: true },
              ].map((link) => {
                const className = 'text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/55 transition-colors duration-300 hover:text-foreground/85 focus-visible:text-foreground/85 sm:tracking-[0.15em]'
                return link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={className}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Copyright + tagline */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-center text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-muted-foreground/45 sm:tracking-[0.3em]">
                The future of discovery
              </p>
              <p className="text-center text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-muted-foreground/50 sm:tracking-[0.2em]">
                &copy; {year ?? ''} SeekEngine &middot; All rights reserved
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
