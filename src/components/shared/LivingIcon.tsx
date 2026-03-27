'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

type AgentState = null | 'thinking' | 'listening' | 'talking'

export default function LivingIcon({ 
  color = '#3B82F6',
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
  // Convert hex color to RGB for the gradient
  const rgbColor = useMemo(() => {
    if (!color.startsWith('#')) return color
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return { r, g, b, css: `rgb(${r}, ${g}, ${b})` }
  }, [color])

  // Dynamic animation based on agent state
  const getAnimationConfig = () => {
    switch (agentState) {
      case 'listening':
        return { 
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.9, 0.6],
          duration: 1.2 
        }
      case 'talking':
        return { 
          scale: [1, 1.3, 1],
          opacity: [0.7, 1, 0.7],
          duration: 0.8 
        }
      case 'thinking':
        return { 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
          duration: 2 
        }
      default:
        return { 
          scale: [1, 1.05, 1],
          opacity: [0.4, 0.6, 0.4],
          duration: 3 
        }
    }
  }

  const volumeScale = Math.max(inputVolume, outputVolume)
  const { scale, opacity, duration } = getAnimationConfig()

  return (
    <div className={`relative flex items-center justify-center ${size} ${className}`}>
      {/* Animated gradient background */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.2))' }}
      >
        <defs>
          <radialGradient id="orbGradient" cx="35%" cy="35%">
            <stop offset="0%" stopColor={typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.8)` : color} />
            <stop offset="70%" stopColor={typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.4)` : color} />
            <stop offset="100%" stopColor={typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.1)` : color} />
          </radialGradient>
          <filter id="orbGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer pulsing layer */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#orbGradient)"
          opacity="0.3"
          animate={{ scale, opacity }}
          transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
          filter="url(#orbGlow)"
        />

        {/* Middle glow layer */}
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={typeof rgbColor === 'object' ? rgbColor.css : color}
          strokeWidth="0.5"
          animate={{
            r: [40, 45, 40],
            opacity: agentState === 'talking' ? [0.3, 0.6, 0.3] : [0.1, 0.2, 0.1],
          }}
          transition={{ duration: agentState === 'talking' ? 0.8 : 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Core sphere */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="url(#orbGradient)"
          filter="url(#orbGlow)"
          opacity="0.9"
        />
      </svg>

      {/* Inner breathing core */}
      <motion.div
        animate={{
          scale: [1, 1.05 + volumeScale * 0.1, 1],
          opacity: [0.7, 0.9, 0.7],
          transition: { duration: agentState === 'talking' ? 0.6 : 1.2, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="absolute w-8 h-8 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 1)` : color}, ${typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.4)` : color})`,
          boxShadow: `0 0 20px ${typeof rgbColor === 'object' ? `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.6)` : color}, inset -2px -2px 8px rgba(0, 0, 0, 0.2)`,
        }}
      />

      {/* Volume reactive rings (optional) */}
      {agentState === 'listening' && (
        <>
          <motion.div
            animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-20 h-20 rounded-full border border-current"
            style={{ color }}
          />
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-20 h-20 rounded-full border border-current"
            style={{ color }}
          />
        </>
      )}
    </div>
  )
}
