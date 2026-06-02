'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { MotionConfig } from 'framer-motion'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <MotionConfig reducedMotion="user" transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
        {children}
      </MotionConfig>
    </ThemeProvider>
  )
}
