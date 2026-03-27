'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LocationGreeting from '../shared/LocationGreeting'

/**
 * SiteLoader Component - Cinematic Location Greeting
 * Minimalist, high-end reveal with smooth exit transition.
 */

export default function SiteLoader() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-black"
        >
          <div className="relative flex flex-col items-center">
            {/* The Greeting */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="flex flex-col items-center gap-8"
            >
              <LocationGreeting />
              
              {/* Loading Progress Line */}
              <div className="relative w-[120px] h-[1px] bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-zinc-900 dark:bg-zinc-100 rounded-full"
                />
              </div>
            </motion.div>

            {/* Preparation Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="absolute bottom-[-60px] whitespace-nowrap"
            >
              <span className="text-[10px] uppercase tracking-[0.5em] font-medium text-black dark:text-white">
                Preparing
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
