'use client'

import React, { useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
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
  inViewMargin?: string
  spread?: number
}

/**
 * ShimmeringText Component
 * Inspired by ElevenLabs UI (ui.elevenlabs.io)
 * Features: Animated gradient text shimmer with viewport detection
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
}: ShimmeringTextProps) => {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { 
    once, 
    margin: inViewMargin as any,
    amount: 0.1
  })

  return (
    <motion.span
      ref={ref}
      className={cn(
        "relative inline-block transition-colors duration-300",
        "bg-gradient-to-r from-muted-foreground/40 via-foreground to-muted-foreground/40 bg-no-repeat",
        className
      )}
      animate={(!startOnView || isInView) ? { backgroundPosition: "200% 0" } : { backgroundPosition: "-200% 0" }}
      initial={{ backgroundPosition: "-200% 0" }}
      transition={{
        duration,
        delay,
        repeat: repeat === true ? Infinity : (repeat === false ? 0 : repeat),
        repeatDelay,
        ease: "linear",
      }}
      style={{
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        backgroundSize: `${spread * 100}% 100%`,
        color: "transparent",
      }}
    >
      {text}
    </motion.span>
  )
}
