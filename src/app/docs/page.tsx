import type { Metadata } from 'next'
import { SITE_URL } from '../../lib/site'
import DocsContent from './DocsContent'

export const metadata: Metadata = {
  title: 'Documentation | SeekEngine',
  description: 'How SeekEngine works, how to self-host it, every environment variable, the code layout, and the failures we actually see.',
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    title: 'Documentation | SeekEngine',
    description: 'How SeekEngine works, how to self-host it, every environment variable, the code layout, and the failures we actually see.',
    url: 'https://seekengine.vercel.app/docs',
    siteName: 'SeekEngine',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SeekEngine - Documentation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Documentation | SeekEngine',
    description: 'How SeekEngine works, how to self-host it, every environment variable, the code layout, and the failures we actually see.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
}

export default function DocsPage() {
  return <DocsContent />
}
