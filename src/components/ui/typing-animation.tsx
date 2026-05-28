'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface TypingAnimationProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: string
  duration?: number
  delay?: number
  as?: React.ElementType
  startOnView?: boolean
}

/**
 * TypingAnimation Component
 * Inspired by Magic UI (magicui.design)
 * Modified for SeekEngine: Performance-optimized character-by-character reveals
 */
export function TypingAnimation({
  children,
  duration = 50,
  delay = 0,
  as: Component = "span",
  startOnView = true,
  className,
  ...props
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = React.useState("")
  const [started, setStarted] = React.useState(!startOnView)
  const elementRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    if (!startOnView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [startOnView])

  React.useEffect(() => {
    if (!started) return

    let typingEffect: ReturnType<typeof setInterval> | null = null

    const timeout = setTimeout(() => {
      let i = 0
      typingEffect = setInterval(() => {
        if (i < children.length) {
          setDisplayedText(children.slice(0, i + 1))
          i++
        } else {
          if (typingEffect) clearInterval(typingEffect)
        }
      }, duration)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (typingEffect) clearInterval(typingEffect)
    }
  }, [children, duration, delay, started])

  return (
    <Component
      ref={elementRef}
      className={cn("inline-block", className)}
      {...props}
    >
      {displayedText}
    </Component>
  )
}
