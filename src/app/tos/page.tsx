import type { Metadata } from 'next'
import { SITE_URL } from '../../lib/site'
import TosContent from './TosContent'

export const metadata: Metadata = {
  title: 'Terms of Service | SeekEngine',
  description: 'Terms of service for SeekEngine - an open source AI search engine research project under MIT License.',
  alternates: {
    canonical: '/tos',
  },
  openGraph: {
    title: 'Terms of Service | SeekEngine',
    description: 'Terms of service for SeekEngine - an open source AI search engine research project under MIT License.',
    url: 'https://seekengine.vercel.apptos',
    siteName: 'SeekEngine',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SeekEngine - Terms of Service',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | SeekEngine',
    description: 'Terms of service for SeekEngine - an open source AI search engine research project under MIT License.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
}

export default function TermsOfService() {
  return <TosContent />
}
