import type { Metadata } from 'next'
import PrivacyContent from './PrivacyContent'

export const metadata: Metadata = {
  title: 'Privacy Policy | SeekEngine',
  description: 'Privacy policy for SeekEngine - an open source AI search engine. Learn about data collection, retention, and your rights.',
}

export default function PrivacyPolicy() {
  return <PrivacyContent />
}
