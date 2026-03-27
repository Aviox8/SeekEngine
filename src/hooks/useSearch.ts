'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useDebounce } from './useDebounce'
import { useRouter } from 'next/navigation'

export interface SearchState {
  query: string
  suggestions: string[]
  prediction: string
  isLoading: boolean
  isTyping: boolean
}

export function useSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [prediction, setPrediction] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    // Cancel any in-flight suggestion request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    if (q.trim().length < 2) {
      setSuggestions([])
      setPrediction('')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch(
        `/api/ai/suggest?q=${encodeURIComponent(q)}`,
        { signal: controller.signal }
      )
      if (!response.ok) throw new Error('Failed to fetch suggestions')
      const data = await response.json()
      
      // Only apply if this is still the active request
      if (controller.signal.aborted) return

      const newSuggestions = data.suggestions || []
      setSuggestions(newSuggestions)
      
      if (newSuggestions && newSuggestions.length > 0) {
        const matchingSuggestion = newSuggestions.find((s: any) => 
          typeof s === 'string' && s.toLowerCase().startsWith(q.toLowerCase())
        )
        if (matchingSuggestion) {
          setPrediction(matchingSuggestion)
        } else {
          setPrediction('')
        }
      } else {
        setPrediction('')
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return // Expected cancellation
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
      setPrediction('')
      // CRITICAL FIX: Clear ref to prevent accumulating abandoned AbortControllers
      // Previously non-abort errors would leave controller ref dangling indefinitely
      abortControllerRef.current = null
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchSuggestions(debouncedQuery)
  }, [debouncedQuery, fetchSuggestions])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      // Cancel any pending suggestions when navigating
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      router.push(`/results?q=${encodeURIComponent(searchQuery)}`)
    }
  }, [router])

  const updateQuery = useCallback((newQuery: string) => {
    // Check for slash commands
    if (newQuery === '/about') {
      router.push('/about')
      return
    }
    setQuery(newQuery)
    setIsTyping(newQuery.length > 0)

    // Immediately clear suggestions and prediction when input is emptied
    if (newQuery.length === 0) {
      setSuggestions([])
      setPrediction('')
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [router])

  return {
    query,
    suggestions,
    prediction,
    isLoading,
    isTyping,
    updateQuery,
    handleSearch,
    setSuggestions,
    setPrediction
  }
}
