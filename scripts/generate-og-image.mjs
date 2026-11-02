/**
 * Generates public/og-image.png (1200x630) for social previews.
 * Run with: node scripts/generate-og-image.mjs
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public', 'og-image.png')

const W = 1200
const H = 630

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="0%" r="90%">
      <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.28"/>
      <stop offset="55%" stop-color="#4f46e5" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#050507" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="baseline" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0"/>
      <stop offset="50%" stop-color="#818cf8" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="#050507"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <g stroke="#ffffff" stroke-opacity="0.08" stroke-width="1">
    <line x1="80" y1="40" x2="80" y2="72"/>
    <line x1="64" y1="56" x2="96" y2="56"/>
    <line x1="${W - 80}" y1="${H - 72}" x2="${W - 80}" y2="${H - 40}"/>
    <line x1="${W - 96}" y1="${H - 56}" x2="${W - 64}" y2="${H - 56}"/>
    <line x1="${W - 80}" y1="40" x2="${W - 80}" y2="72"/>
    <line x1="${W - 96}" y1="56" x2="${W - 64}" y2="56"/>
    <line x1="80" y1="${H - 72}" x2="80" y2="${H - 40}"/>
    <line x1="64" y1="${H - 56}" x2="96" y2="${H - 56}"/>
  </g>

  <g stroke="#ffffff" stroke-opacity="0.045" stroke-width="1">
    <line x1="0" y1="176" x2="${W}" y2="176"/>
    <line x1="0" y1="${H - 176}" x2="${W}" y2="${H - 176}"/>
  </g>

  <g transform="translate(${W / 2}, 206)">
    <circle r="34" fill="none" stroke="#e4e4e7" stroke-width="3"/>
    <circle r="12" fill="#6366f1"/>
    <line x1="34" y1="0" x2="46" y2="0" stroke="#e4e4e7" stroke-width="3"/>
    <line x1="-34" y1="0" x2="-46" y2="0" stroke="#e4e4e7" stroke-width="3"/>
    <line x1="0" y1="34" x2="0" y2="46" stroke="#e4e4e7" stroke-width="3"/>
    <line x1="0" y1="-34" x2="0" y2="-46" stroke="#e4e4e7" stroke-width="3"/>
  </g>

  <text x="${W / 2}" y="352" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="96" letter-spacing="14" fill="#fafafa">SEEKENGINE</text>

  <rect x="${W / 2 - 180}" y="400" width="360" height="3" fill="url(#baseline)"/>

  <text x="${W / 2}" y="458" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="400"
        font-size="30" letter-spacing="10" fill="#a1a1aa">SYNC OF HUMAN INTENT</text>

  <text x="${W / 2}" y="${H - 92}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="400"
        font-size="22" letter-spacing="4" fill="#52525b">AI-ENHANCED SEARCH · seekengine.vercel.app</text>
</svg>
`

await sharp(Buffer.from(svg)).png({ quality: 95 }).toFile(out)
console.log(`OG image written to ${path.relative(root, out)}`)
