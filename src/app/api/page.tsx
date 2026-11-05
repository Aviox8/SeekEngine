import type { Metadata } from 'next'
import { SITE_URL } from '../../lib/site'
import ApiContent from './ApiContent'

export const metadata: Metadata = {
  title: 'API Reference | SeekEngine',
  description: 'Every public SeekEngine endpoint: search, the answer stream, suggestions and operator telemetry, with rate limits and the error envelope.',
  alternates: {
    canonical: '/api',
  },
  openGraph: {
    title: 'API Reference | SeekEngine',
    description: 'Every public SeekEngine endpoint: search, the answer stream, suggestions and operator telemetry, with rate limits and the error envelope.',
    url: 'https://seekengine.vercel.app/api',
    siteName: 'SeekEngine',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SeekEngine - API Reference',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'API Reference | SeekEngine',
    description: 'Every public SeekEngine endpoint: search, the answer stream, suggestions and operator telemetry, with rate limits and the error envelope.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
}

export default function ApiPage() {
  return <ApiContent />
}
