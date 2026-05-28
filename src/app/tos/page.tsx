import type { Metadata } from 'next'
import TosContent from './TosContent'

export const metadata: Metadata = {
  title: 'Terms of Service | SeekEngine',
  description: 'Terms of service for SeekEngine - an open source AI search engine research project under MIT License.',
}

export default function TermsOfService() {
  return <TosContent />
}
