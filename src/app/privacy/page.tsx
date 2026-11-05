import type { Metadata } from 'next'
import { SITE_URL } from '../../lib/site'
import PrivacyContent from './PrivacyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy | SeekEngine',
  description: 'Privacy policy for SeekEngine - an open source AI search engine. Learn about data collection, retention, and your rights.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | SeekEngine',
    description: 'Privacy policy for SeekEngine - an open source AI search engine. Learn about data collection, retention, and your rights.',
    url: 'https://seekengine.vercel.appprivacy',
    siteName: 'SeekEngine',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SeekEngine - Privacy Policy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | SeekEngine',
    description: 'Privacy policy for SeekEngine - an open source AI search engine. Learn about data collection, retention, and your rights.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
}

export default function PrivacyPolicy() {
  return <PrivacyContent />
}
