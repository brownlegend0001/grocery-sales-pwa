// Rasterises favicon.svg into the PNG sizes iOS / Android / PWA need.
// Run once after install:  npm run icons
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(resolve(root, 'public/favicon.svg'))
mkdirSync(resolve(root, 'public/icons'), { recursive: true })

const jobs = [
  ['public/apple-touch-icon.png', 180, false],
  ['public/icons/icon-192.png', 192, false],
  ['public/icons/icon-512.png', 512, false],
  ['public/icons/maskable-512.png', 512, true]
]

for (const [out, size, maskable] of jobs) {
  let img = sharp(svg).resize(size, size)
  if (maskable) {
    // Maskable icons need padding so the safe zone isn't clipped by the OS mask.
    const inner = Math.round(size * 0.8)
    img = sharp(svg)
      .resize(inner, inner)
      .extend({
        top: (size - inner) / 2, bottom: (size - inner) / 2,
        left: (size - inner) / 2, right: (size - inner) / 2,
        background: '#0f172a'
      })
  }
  await img.png().toFile(resolve(root, out))
  console.log('wrote', out)
}
