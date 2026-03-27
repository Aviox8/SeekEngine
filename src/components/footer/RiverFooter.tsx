'use client'

import React, { useEffect, useRef, useState } from 'react'
import LivingIcon from '../shared/LivingIcon'

/**
 * RiverFooter Component
 * An animated, flowing river effect using Canvas API.
 * High-performance ambient motion with proper lifecycle management.
 */

export default function RiverFooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)
  const isVisibleRef = useRef(false)

  // Architectural Hardening: Separate setup from visibility tracking
  useEffect(() => {
    setMounted(true)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let throttleTimeoutId: ReturnType<typeof setTimeout> | null = null
    let w: number, h: number
    let offset = 0

    const waves = [
      { amplitude: 15, frequency: 0.01, speed: 0.02, color: '#3b82f61a' }, // Blue-ish
      { amplitude: 10, frequency: 0.02, speed: -0.015, color: '#8b5cf614' }, // Purple-ish
      { amplitude: 20, frequency: 0.005, speed: 0.01, color: '#10b9810d' },  // Emerald-ish
      { amplitude: 8, frequency: 0.03, speed: 0.04, color: '#ef444408' }     // Red-ish
    ]

    const setCanvasSize = () => {
      // Performance Polish: Handle High-DPI screens
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth
      h = 150
      canvas.width = w * dpr
      canvas.height = h * dpr
      // Reset transform before scaling to prevent compounding on repeated resizes
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const render = () => {
      // Visibility Throttling: If not visible, slow down the loop to save battery
      if (!isVisibleRef.current) {
        throttleTimeoutId = setTimeout(() => {
            throttleTimeoutId = null
            animationFrameId = requestAnimationFrame(render)
        }, 250)
        return
      }
      
      ctx.clearRect(0, 0, w, h)
      offset += 1

      waves.forEach(wave => {
        ctx.beginPath()
        ctx.moveTo(0, h)

        for (let x = 0; x <= w; x += 10) {
          const y = h / 2 + Math.sin(x * wave.frequency + offset * wave.speed) * wave.amplitude
          ctx.lineTo(x, y)
        }

        ctx.lineTo(w, h)
        ctx.fillStyle = wave.color
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    let resizeRaf: number
    const handleResize = () => {
      cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(setCanvasSize)
    }

    setCanvasSize()
    render()

    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(animationFrameId)
      if (throttleTimeoutId !== null) clearTimeout(throttleTimeoutId)
      cancelAnimationFrame(resizeRaf)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Visibility Observer: Attached once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting
    }, { threshold: 0.1 })
    
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  // Dashboard State
  const [time, setTime] = useState('')
  const [latency, setLatency] = useState(12)

  // Live Clock & Ping Simulator
  useEffect(() => {
    // Clock
    const timeInterval = setInterval(() => {
        setTime(new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        }))
    }, 1000)
    setTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }))

    // Latency Jitter
    const pingInterval = setInterval(() => {
        setLatency(prev => {
            const jitter = Math.floor(Math.random() * 5) - 2 // -2 to +2
            return Math.max(5, Math.min(40, prev + jitter))
        })
    }, 2000)

    return () => {
        clearInterval(timeInterval)
        clearInterval(pingInterval)
    }
  }, [])

  // Location State
  const [location, setLocation] = useState('SYSTEM ONLINE')

  useEffect(() => {
    // Attempt to fetch user location for personalized "System Active" status
    // Silently updates if successful, otherwise stays "SYSTEM ONLINE"
    const controller = new AbortController()
    const fetchLocation = async () => {
        try {
            const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout
            
            const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
            clearTimeout(timeoutId)
            
            if (res.ok) {
                const data = await res.json()
                if (data.city && data.region_code) {
                    setLocation(`${data.city.toUpperCase()}, ${data.region_code}`)
                }
            }
        } catch (e) {
            // If fails, we just keep "SYSTEM ONLINE" - no UI jar
        }
    }
    fetchLocation()
    return () => controller.abort()
  }, [])

  if (!mounted) return null

  return (
    <footer className="relative w-full h-[120px] overflow-hidden mt-auto border-t border-black/5 dark:border-white/5 bg-[#fbfbfd] dark:bg-[#050505] z-0 transition-colors duration-500">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 opacity-30 mix-blend-soft-light" 
        aria-hidden="true"
        role="presentation"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 dark:from-black/90 via-transparent to-transparent" />
      
      {/* Footer Content Overlay - Clean Line */}
      <div className="absolute bottom-0 left-0 right-0 px-8 pb-8 flex items-end justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-600 font-medium tracking-wide">
        
        {/* Left: Latency */}
        <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-emerald-500/50"></span>
            <span>{latency}ms</span>
        </div>

        {/* Center: System Status (No Pill) */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 flex items-center gap-2">
            <LivingIcon color="#6F6F6F" size="w-1.5 h-1.5" className="mr-0.5" />
            <span className="uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500">
                {location}
            </span>
        </div>

        {/* Right: Clock */}
        <div className="tabular-nums">
            {time}
        </div>
      </div>
    </footer>
  )
}
