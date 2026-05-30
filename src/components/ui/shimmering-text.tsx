'use client'

import React, { useMemo } from 'react'
import { motion, useInView, type Margin } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ShimmeringTextProps {
  text: string
  duration?: number
  delay?: number
  repeat?: boolean | number
  repeatDelay?: number
  className?: string
  startOnView?: boolean
  once?: boolean
  inViewMargin?: Margin
  spread?: number
  disabled?: boolean
}

/**
 * ShimmeringText Component
 * Inspired by ElevenLabs UI (ui.elevenlabs.io)
 * Features: Smooth animated gradient shimmer with viewport detection and optimized rendering
 */
export const ShimmeringText = ({
  text,
  duration = 2,
  delay = 0,
  repeat = Infinity,
  repeatDelay = 0.5,
  className,
  startOnView = true,
  once = false,
  inViewMargin = "0px 0px -10% 0px",
  spread = 2,
  disabled = false,
}: ShimmeringTextProps) => {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { 
    once, 
    margin: inViewMargin,
    amount: 0.1
  })

  // Memoize style object to prevent recreation on every render
  const shimmerStyle = useMemo(() => ({
    backgroundClip: "text" as const,
    WebkitBackgroundClip: "text",
    backgroundSize: `${spread * 100}% 100%`,
    color: "transparent" as const,
    backgroundPosition: disabled || (startOnView && !isInView) ? "-200% 0" : "200% 0",
  }), [spread, disabled, startOnView, isInView])

  if (disabled) {
    return <span className={className}>{text}</span>
  }

  return (
    <motion.span
      ref={ref}
      className={cn(
        "relative inline-block transition-colors duration-300",
        "bg-gradient-to-r from-muted-foreground/30 via-foreground to-muted-foreground/30 bg-no-repeat",
        className
      )}
      animate={{ backgroundPosition: (startOnView && !isInView) ? "-200% 0" : "200% 0" }}
      initial={{ backgroundPosition: "-200% 0" }}
      transition={{
        duration,
        delay,
        repeat: repeat === true ? Infinity : (repeat === false ? 0 : repeat),
        repeatDelay,
        ease: "linear",
      }}
      style={shimmerStyle}
    >
      {text}
    </motion.span>
  )
}
