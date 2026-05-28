import { Suspense } from 'react'
import type { Metadata } from 'next'
import ResultsClient from './ResultsClient'

export const metadata: Metadata = {
  title: 'Search Results | SeekEngine',
  description: 'AI-powered search results with synthesized answers and web sources.',
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsFallback />}>
      <ResultsClient />
    </Suspense>
  )
}

function ResultsFallback() {
  return (
    <main className="min-h-screen bg-white dark:bg-black pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
          <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3"
            >
              <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
