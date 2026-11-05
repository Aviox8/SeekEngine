import type { Metadata } from 'next'
import { SITE_URL } from '../../lib/site'
import ComplianceContent from './ComplianceContent'

export const metadata: Metadata = {
  title: 'Compliance & Data Handling | SeekEngine',
  description: 'Exactly what SeekEngine collects, where your query goes, how providers handle it, and your rights — with no aspirational language.',
  alternates: {
    canonical: '/compliance',
  },
  openGraph: {
    title: 'Compliance & Data Handling | SeekEngine',
    description: 'Exactly what SeekEngine collects, where your query goes, how providers handle it, and your rights — with no aspirational language.',
    url: 'https://seekengine.vercel.app/compliance',
    siteName: 'SeekEngine',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SeekEngine - Compliance & Data Handling',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compliance & Data Handling | SeekEngine',
    description: 'Exactly what SeekEngine collects, where your query goes, how providers handle it, and your rights — with no aspirational language.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
  },
}

export default function CompliancePage() {
  return <ComplianceContent />
}
