/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Pin Turbopack's workspace root to this project — a stray package-lock.json
  // in the home directory otherwise makes Next infer C:\Users\<user> as root
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js App Router uses inline bootstrap scripts — nonce-based strict CSP is not configured yet
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://www.google.com",
              "font-src 'self' data:",
              "connect-src 'self' https://openrouter.ai https://ipapi.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

// ─── Build-time environment validation ───
// Only enforce on CI/production (Vercel sets VERCEL=1)
// Either a single key or the comma/newline-separated pool is sufficient.
const hasOpenRouterKey =
  !!process.env.OPENROUTER_API_KEY || !!process.env.OPENROUTER_API_KEYS
const missing = hasOpenRouterKey ? [] : ['OPENROUTER_API_KEY (or OPENROUTER_API_KEYS)']
if (missing.length > 0 && process.env.VERCEL === '1') {
  throw new Error(`❌ Missing required env vars: ${missing.join(', ')}`)
} else if (missing.length > 0) {
  console.warn(`⚠️  Missing env vars (non-fatal in dev): ${missing.join(', ')}`)
}

module.exports = nextConfig
