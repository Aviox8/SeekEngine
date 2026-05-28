'use client'

import { motion } from 'framer-motion'
import { useMemo, useId } from 'react'

type AgentState = null | 'thinking' | 'listening' | 'talking'

export default function LivingIcon({ 
  color = '#6F6F6F',
  className = '',
  size = 'w-16 h-16',
  agentState = null,
  inputVolume = 0,
  outputVolume = 0,
}: {
  color?: string
  className?: string
  size?: string
  agentState?: AgentState
  inputVolume?: number
  outputVolume?: number
}) {
  const uniqueId = useId()
  // Parse hex color to RGB
  const rgbColor = useMemo(() => {
    if (!color.startsWith('#')) return color
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return { r, g, b, css: `rgb(${r}, ${g}, ${b})` }
  }, [color])

  const volumeScale = Math.max(inputVolume, outputVolume)
  const isAlive = !!agentState || volumeScale > 0

  // Organic breathing curves with natural rhythm
  const breathingVariants = {
    thinking: {
      scale: [1, 1.08, 0.98, 1.05, 1],
      opacity: [0.5, 0.75, 0.55, 0.8, 0.5],
    },
    listening: {
      scale: [1, 1.2, 0.95, 1.15, 1],
      opacity: [0.65, 1, 0.6, 0.95, 0.65],
    },
    talking: {
      scale: [1, 1.35, 0.9, 1.3, 1],
      opacity: [0.8, 1, 0.7, 1, 0.8],
    },
    idle: {
      scale: [1, 1.03, 0.99, 1.02, 1],
      opacity: [0.4, 0.5, 0.35, 0.48, 0.4],
    }
  }

  const getDuration = () => {
    if (agentState === 'talking') return 1.2
    if (agentState === 'listening') return 1.6
    if (agentState === 'thinking') return 2.4
    return 3.2
  }

  const breathState = agentState || 'idle'
  const duration = getDuration()

  return (
    <div className={`relative flex items-center justify-center ${size} ${className}`}>
      {/* Multi-layer SVG orb with living animations */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 14px 40px rgba(0, 0, 0, 0.3))' }}
      >
        <defs>
          {/* Primary radial gradient */}
          <radialGradient id="orbGradient" cx="40%" cy="40%">
            <stop offset="0%" stopColor={typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 1)` : color} />
            <stop offset="50%" stopColor={typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.6)` : color} />
            <stop offset="100%" stopColor={typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.15)` : color} />
          </radialGradient>

          {/* Subtle shimmer gradient */}
          <linearGradient id="shimmerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="orbGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Enhanced glow for talking state */}
          <filter id="intensGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feFlood floodColor={typeof rgbColor === 'object' ? rgbColor.css : color} result="glowColor"/>
            <feComposite in="glowColor" in2="coloredBlur" operator="in" result="softGlow"/>
            <feMerge>
              <feMergeNode in="softGlow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer aura layer - most alive effect */}
        <motion.circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#orbGradient)"
          animate={{
            opacity: breathingVariants[breathState as keyof typeof breathingVariants].opacity,
            scale: [1, 1.08, 0.96, 1.04, 1],
          }}
          transition={{ 
            duration: duration * 1.3, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          filter="url(#orbGlow)"
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* Middle energetic layer */}
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={typeof rgbColor === 'object' ? rgbColor.css : color}
          strokeWidth="1"
          animate={{
            opacity: agentState === 'talking' ? [0.4, 0.8, 0.3, 0.7, 0.4] : [0.15, 0.3, 0.1, 0.25, 0.15],
            scale: [1, 1.14, 0.95, 1.07, 1],
          }}
          transition={{ 
            duration: duration * 1.1, 
            repeat: Infinity, 
            ease: 'easeInOut',
            delay: 0.1
          }}
          filter="url(#orbGlow)"
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* Core sphere - main body */}
        <motion.circle
          cx="50"
          cy="50"
          r="36"
          fill="url(#orbGradient)"
          animate={{
            scale: breathingVariants[breathState as keyof typeof breathingVariants].scale,
          }}
          transition={{ 
            duration, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          filter={`url(#${breathState === 'talking' ? 'intensGlow' : 'orbGlow'})`}
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* Shimmer highlight - light reflection */}
        <motion.circle
          cx="30"
          cy="30"
          r="18"
          fill="url(#shimmerGrad)"
          animate={{
            opacity: [0.2, 0.4, 0.15, 0.35, 0.2],
            scale: [1, 1.22, 0.89, 1.11, 1],
          }}
          transition={{ 
            duration: duration * 0.9, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          style={{ transformOrigin: '30px 30px' }}
        />

        {/* Inner core pulse - heartbeat effect */}
        <motion.circle
          cx="50"
          cy="50"
          r="28"
          fill={typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.4)` : color}
          animate={{
            opacity: [0.3, 0.7, 0.2, 0.6, 0.3],
            scale: [1, 1.14, 0.93, 1.07, 1],
          }}
          transition={{ 
            duration: duration * 0.85, 
            repeat: Infinity, 
            ease: 'easeInOut',
            delay: 0.05
          }}
          style={{ transformOrigin: '50px 50px' }}
        />
      </svg>

      {/* Enhanced inner breathing core with glow */}
      <motion.div
        animate={{
          scale: breathingVariants[breathState as keyof typeof breathingVariants].scale,
          opacity: breathingVariants[breathState as keyof typeof breathingVariants].opacity,
        }}
        transition={{ 
          duration, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
        className="absolute w-7 h-7 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.95)` : color}, ${typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.3)` : color})`,
          boxShadow: `
            0 0 16px ${typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.8)` : color},
            0 0 32px ${typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.4)` : color},
            inset -1.5px -1.5px 6px rgba(0, 0, 0, 0.3),
            inset 2px 2px 6px rgba(255, 255, 255, 0.1)
          `,
        }}
      />

      {/* Dynamic listener rings - only when listening */}
      {agentState === 'listening' && (
        <>
          {/* Wave ring 1 */}
          <motion.div
            animate={{ 
              scale: [1, 2.2, 1], 
              opacity: [0.6, 0, 0.6] 
            }}
            transition={{ 
              duration: 1.2, 
              repeat: Infinity, 
              ease: [0.34, 1.56, 0.64, 1] // spring-like easing
            }}
            className="absolute rounded-full border-2"
            style={{ 
              width: '80px',
              height: '80px',
              borderColor: typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.8)` : color,
            }}
          />

          {/* Wave ring 2 - staggered */}
          <motion.div
            animate={{ 
              scale: [1, 2.4, 1], 
              opacity: [0.4, 0, 0.4] 
            }}
            transition={{ 
              duration: 1.4, 
              repeat: Infinity, 
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.2
            }}
            className="absolute rounded-full border"
            style={{ 
              width: '80px',
              height: '80px',
              borderColor: typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.4)` : color,
              borderWidth: '1px',
            }}
          />

          {/* Wave ring 3 - more stagger */}
          <motion.div
            animate={{ 
              scale: [1, 2.6, 1], 
              opacity: [0.2, 0, 0.2] 
            }}
            transition={{ 
              duration: 1.6, 
              repeat: Infinity, 
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.4
            }}
            className="absolute rounded-full border"
            style={{ 
              width: '80px',
              height: '80px',
              borderColor: typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.2)` : color,
              borderWidth: '1px',
            }}
          />
        </>
      )}

      {/* Talking state - extra pulse rings */}
      {agentState === 'talking' && (
        <motion.div
          animate={{ 
            scale: [1, 1.8], 
            opacity: [0.8, 0] 
          }}
          transition={{ 
            duration: 0.6, 
            repeat: Infinity, 
            ease: 'easeOut' 
          }}
          className="absolute rounded-full border-2"
          style={{ 
            width: '72px',
            height: '72px',
            borderColor: typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.9)` : color,
          }}
        />
      )}
    </div>
  )
}
