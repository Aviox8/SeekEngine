/**
 * Canonical site URL — single source of truth for metadata, sitemap,
 * robots.txt, JSON-LD, and provider attribution headers.
 * Override with NEXT_PUBLIC_SITE_URL when deploying to another domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://seekengine.vercel.app').replace(/\/+$/, '')
