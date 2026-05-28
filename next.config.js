/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
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
        ],
      },
    ]
  },
}

// ─── Build-time environment validation ───
// Only enforce on CI/production (Vercel sets VERCEL=1)
const required = ['OPENROUTER_API_KEY']
const missing = required.filter((k) => !process.env[k])
if (missing.length > 0 && process.env.VERCEL === '1') {
  throw new Error(`❌ Missing required env vars: ${missing.join(', ')}`)
} else if (missing.length > 0) {
  console.warn(`⚠️  Missing env vars (non-fatal in dev): ${missing.join(', ')}`)
}

module.exports = nextConfig
