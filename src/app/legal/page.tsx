import type { Metadata } from 'next'
import { SITE_URL } from '../../lib/site'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Legal | SeekEngine',
  description: 'Terms of service, privacy policy and compliance for SeekEngine — the fine print, in three short documents.',
  alternates: {
    canonical: '/legal',
  },
  openGraph: {
    title: 'Legal | SeekEngine',
    description: 'Terms of service, privacy policy and compliance for SeekEngine — the fine print, in three short documents.',
    url: 'https://seekengine.vercel.app/legal',
    siteName: 'SeekEngine',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SeekEngine - Legal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal | SeekEngine',
    description: 'Terms of service, privacy policy and compliance for SeekEngine — the fine print, in three short documents.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
}

const DOCUMENTS = [
  {
    href: '/tos',
    badge: 'Terms',
    title: 'Terms of service',
    summary: 'MIT license, acceptable use, no warranty, what the hosted demo does and does not owe you.',
  },
  {
    href: '/privacy',
    badge: 'Privacy',
    title: 'Privacy policy',
    summary: 'No accounts, no profiles, no identity. Rate-limit IPs, aggregate analytics, TTL-bound caches.',
  },
  {
    href: '/compliance',
    badge: 'Compliance',
    title: 'Data & compliance',
    summary: 'Where your query goes, what each provider sees, and why nothing here wears a certification badge.',
  },
]

export default function LegalPage() {
  return (
    <main className="relative min-h-screen bg-background pb-24 pt-24 sm:pt-28">
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-6">
        <header className="mb-12 space-y-5 border-b border-foreground/[0.07] pb-10 sm:mb-16 sm:pb-12">
          <span className="inline-block rounded-lg bg-foreground/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground/75">
            Legal
          </span>
          <h1 className="font-display text-[clamp(2.25rem,6vw,4rem)] leading-[0.98] tracking-[-0.025em] text-foreground">
            The fine print,<br />
            <span className="font-display-italic text-foreground/45">three documents long.</span>
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-foreground/65 sm:text-base">
            SeekEngine is an open-source research project, not a company. These documents exist because
            honest software says what it does — everything else is code you can read.
          </p>
        </header>

        <nav aria-label="Legal documents" className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {DOCUMENTS.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="group flex flex-col rounded-2xl bg-foreground/[0.03] p-5 transition-[background-color,transform] duration-200 hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 sm:p-6"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                {doc.badge}
              </span>
              <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
                {doc.title}
              </h2>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground/80">
                {doc.summary}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground/70 transition-colors group-hover:text-foreground">
                Read
                <svg className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          ))}
        </nav>

        <p className="mt-10 text-[11px] leading-relaxed text-muted-foreground/50 sm:mt-12">
          Questions about anything in these documents: open an issue on{' '}
          <a href="https://github.com/archduke1337/SeekEngine" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            GitHub
          </a>{' '}
          or write to the maintainers at{' '}
          <a href="https://github.com/archduke1337" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            archduke1337 (original developer)
          </a>{' '}
          and{' '}
          <a href="https://github.com/Aviox8" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            Aviox8 (maintainer)
          </a>.
        </p>
      </div>
    </main>
  )
}
