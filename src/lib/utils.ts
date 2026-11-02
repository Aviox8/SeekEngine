import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Compare two strings in time proportional to the longer string,
 * regardless of where the first mismatch occurs.
 * Prevents timing attacks when comparing secrets like admin tokens.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false
  }

  const maxLength = Math.max(a.length, b.length)
  let mismatch = a.length === b.length ? 0 : 1

  for (let i = 0; i < maxLength; i++) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }

  return mismatch === 0
}
