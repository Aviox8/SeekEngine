'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'

const CrowdCanvas = dynamic(() => import('./CanvasCrowd'), { ssr: false })

export default function DynamicCanvasCrowd() {
  return (
    <footer className="relative w-full overflow-hidden">
      {/* Gradient fade at top */}
      <div
        className="absolute top-0 left-0 right-0 h-24 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, hsl(var(--background)), transparent)`,
        }}
      />

      {/* Canvas crowd animation */}
      <div className="h-[45vh] relative">
        <CrowdCanvas src="/images/peeps/all-peeps.png" rows={15} cols={7} />
      </div>

      {/* Footer content overlay */}
      <div className="relative z-20 -mt-32 pb-8">
        {/* Gradient fade from canvas to content */}
        <div
          className="h-32 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent, hsl(var(--background)))`,
          }}
        />

        <div className="bg-background px-6">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
            {/* Logo + brand */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="SeekEngine"
                width={20}
                height={20}
                className="opacity-30 group-hover:opacity-60 transition-opacity duration-300"
              />
              <span className="font-display text-sm tracking-tight text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors duration-300">
                SeekEngine
              </span>
            </Link>

            {/* Decorative divider */}
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-foreground/8 to-transparent" />

            {/* Navigation links */}
            <nav className="flex items-center gap-8">
              {[
                { label: 'About', href: '/about' },
                { label: 'Terms', href: '/tos' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Developer', href: 'https://archduke.is-a.dev/about', external: true },
                { label: 'Source', href: 'https://github.com/archduke1337/SeekEngine', external: true },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground/25 hover:text-foreground/60 transition-all duration-300 hover:tracking-[0.2em]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Copyright + tagline */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-[9px] tracking-[0.3em] uppercase text-muted-foreground/15">
                The future of discovery
              </p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/20">
                &copy; {new Date().getFullYear()} SeekEngine &middot; All rights reserved
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
