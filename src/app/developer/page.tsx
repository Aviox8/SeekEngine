import type { Metadata } from 'next'
import { SITE_URL } from '../../lib/site'
import DeveloperContent from './DeveloperContent'

export const metadata: Metadata = {
  title: 'Developer | SeekEngine',
  description: 'SeekEngine is an open-source research project. Stack, local setup, contributing conventions, license and credits.',
  alternates: {
    canonical: '/developer',
  },
  openGraph: {
    title: 'Developer | SeekEngine',
    description: 'SeekEngine is an open-source research project. Stack, local setup, contributing conventions, license and credits.',
    url: 'https://seekengine.vercel.app/developer',
    siteName: 'SeekEngine',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SeekEngine - Developer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer | SeekEngine',
    description: 'SeekEngine is an open-source research project. Stack, local setup, contributing conventions, license and credits.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
}

export default function DeveloperPage() {
  return <DeveloperContent />
}
