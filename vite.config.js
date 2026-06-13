import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// If you deploy to https://<user>.github.io/<repo>/ set base to '/<repo>/'.
// Override at build time with:  VITE_BASE=/grocery-shop-app/ npm run build
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Grocery Sales',
        short_name: 'Sales',
        description: 'Daily sales tracker synced to Google Sheets',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // App shell is precached; the Google Sheets API is handled by our own
        // outbox queue, so we never cache POSTs. GET data uses NetworkFirst.
        navigateFallback: base + 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.href.includes('script.google.com'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sheets-api',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
            }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ]
})
