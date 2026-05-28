import type { Metadata } from 'next'
import AboutContent from './AboutContent'

export const metadata: Metadata = {
  title: 'About | SeekEngine',
  description: 'Learn about SeekEngine - an open source AI-enhanced search engine built with grounding and retrieval-augmented generation research.',
}

export default function AboutPage() {
  return <AboutContent />
}
