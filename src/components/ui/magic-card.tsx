'use client'

/**
 * MagicCard — Gradient shader card with animated border and glassmorphism
 * Inspired by Magic UI / Aceternity UI patterns
 */

import { cn } from '@/lib/utils'
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { useCallback, useRef } from 'react'

interface MagicCardProps {
  children: React.ReactNode
  className?: string
  gradientFrom?: string
  gradientTo?: string
  gradientOpacity?: number
  /** Show animated gradient border on hover */
  borderGlow?: boolean
  /** Static subtle gradient background */
  meshGradient?: boolean
}

export function MagicCard({
  children,
  className,
  gradientFrom = '#7c3aed',
  gradientTo = '#2563eb',
  gradientOpacity = 0,
  borderGlow = true,
  meshGradient = false,
}: MagicCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return
      const { left, top } = ref.current.getBoundingClientRect()
      mouseX.set(e.clientX - left)
      mouseY.set(e.clientY - top)
    },
    [mouseX, mouseY]
  )

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-100)
    mouseY.set(-100)
  }, [mouseX, mouseY])

  const background = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}15, transparent 80%)`
  const borderBackground = useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}30, ${gradientTo}10, transparent 80%)`

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative rounded-2xl overflow-hidden transition-all duration-300',
        className
      )}
    >
      {/* Animated border glow */}
      {borderGlow && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: borderBackground }}
        />
      )}

      {/* Card surface */}
      <div className="relative rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 h-full">
        {/* Spotlight gradient */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background }}
        />

        {/* Mesh gradient background */}
        {meshGradient && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.03]"
            style={{
              background: `
                radial-gradient(at 27% 37%, ${gradientFrom} 0px, transparent 50%),
                radial-gradient(at 97% 21%, ${gradientTo} 0px, transparent 50%),
                radial-gradient(at 52% 99%, ${gradientFrom}88 0px, transparent 50%)
              `,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}

/**
 * ShimmerBorder — Card with animated gradient shimmer border
 */
export function ShimmerBorder({
  children,
  className,
  shimmerColor = 'from-violet-500 via-cyan-400 to-violet-500',
  borderWidth = 1,
}: {
  children: React.ReactNode
  className?: string
  shimmerColor?: string
  borderWidth?: number
}) {
  return (
    <div className={cn('relative rounded-2xl group', className)}>
      {/* Animated shimmer border */}
      <div
        className="absolute -inset-px rounded-2xl overflow-hidden"
        style={{ padding: borderWidth }}
      >
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r animate-shimmer opacity-40 group-hover:opacity-80 transition-opacity',
            shimmerColor
          )}
          style={{ backgroundSize: '200% 100%' }}
        />
      </div>

      {/* Card body */}
      <div className="relative rounded-2xl bg-card backdrop-blur-xl h-full">
        {children}
      </div>
    </div>
  )
}

/**
 * GradientText — Animated gradient text
 */
export function GradientText({
  children,
  className,
  from = '#7c3aed',
  via = '#06b6d4',
  to = '#2563eb',
  animate = true,
}: {
  children: React.ReactNode
  className?: string
  from?: string
  via?: string
  to?: string
  animate?: boolean
}) {
  return (
    <span
      className={cn(
        'bg-clip-text text-transparent bg-gradient-to-r',
        animate && 'bg-gradient-xl animate-gradient-shift',
        className
      )}
      style={{
        backgroundImage: `linear-gradient(to right, ${from}, ${via}, ${to}, ${from})`,
        backgroundSize: animate ? '200% auto' : '100% auto',
      }}
    >
      {children}
    </span>
  )
}

/**
 * Particles — Floating ambient particles  
 */
export function Particles({
  count = 40,
  color = 'rgba(124, 58, 237, 0.15)',
  className,
}: {
  count?: number
  color?: string
  className?: string
}) {
  const particlesRef = useRef(Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
  })))

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particlesRef.current.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: color,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

/**
 * MeshGradientBg — Full page animated mesh gradient background
 */
export function MeshGradientBg({ className }: { className?: string }) {
  return (
    <div className={cn('fixed inset-0 pointer-events-none overflow-hidden', className)}>
      {/* Primary gradient orb */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 60, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full blur-[120px] opacity-[0.07]"
        style={{
          background: 'radial-gradient(circle, #7c3aed, #2563eb, transparent)',
        }}
      />
      {/* Secondary gradient orb */}
      <motion.div
        animate={{
          x: [0, -80, 40, 0],
          y: [0, 60, -40, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.05]"
        style={{
          background: 'radial-gradient(circle, #06b6d4, #7c3aed, transparent)',
        }}
      />
      {/* Tertiary accent orb */}
      <motion.div
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #ec4899, #8b5cf6, transparent)',
        }}
      />
    </div>
  )
}
