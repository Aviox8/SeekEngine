import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import Navbar from '../components/layout/Navbar'
import Providers from '../components/layout/Providers'
import PageTransition from '../components/layout/PageTransition'
import LenisProvider from '../components/layout/LenisProvider'
import ErrorBoundary from '../components/layout/ErrorBoundary'
import KeyboardShortcuts from '../components/layout/KeyboardShortcuts'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ConditionalFooter from '../components/layout/ConditionalFooter'
import '../globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SeekEngine | Sync of Human Intent',
  description:
    'SeekEngine is an high-fidelity industrial AI search platform. Beyond traditional indexing, we operate at the intersection of neural resonance and raw mechanical speed.',
  keywords: ['AI Search', 'Neural Indexing', 'SeekEngine', 'RAG Intelligence', 'Industrial AI', 'Search Architecture', 'Future Search', 'Machine Learning Search'],
  authors: [{ name: 'SeekEngine Team', url: 'https://seekengine.vercel.app' }],
  metadataBase: new URL('https://seekengine.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'SeekEngine | Sync of Human Intent',
    description: 'The future of discovery is not a list of links. It is a sensed synthesis of human intent.',
    url: 'https://seekengine.vercel.app',
    siteName: 'SeekEngine',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SeekEngine - Industrial Intelligence Interface',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SeekEngine | Sync of Human Intent',
    description: 'High-fidelity AI search for the next generation of discovery.',
    creator: '@archduke1337',
    images: ['/og-image.png'],
  },
  verification: {},
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: '/logo.png',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#080808' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* JSON-LD Structured Data for Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "SeekEngine",
              "url": "https://seekengine.vercel.app",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://seekengine.vercel.app/results?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "description": "High-fidelity industrial AI search platform.",
              "publisher": {
                "@type": "Organization",
                "name": "SeekEngine",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://seekengine.vercel.app/logo.png"
                }
              }
            })
          }}
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-hidden`}>
        <Providers>
          <ErrorBoundary>
            {/* Skip to content link for keyboard users */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-foreground focus:text-background focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none"
            >
              Skip to content
            </a>
            <Navbar />
            <LenisProvider>
              <PageTransition>
                <div id="main-content" className="flex-1" tabIndex={-1}>
                   {children}
                </div>
                <ConditionalFooter />
              </PageTransition>
            </LenisProvider>
            <KeyboardShortcuts />
          </ErrorBoundary>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
