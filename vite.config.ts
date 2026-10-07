import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// base = nome del repository, perché il sito è servito da GitHub Pages su
// https://giacomoguaresi.github.io/Logger/ (docs/05-esecuzione.md). I dati
// stanno su Supabase (src/dati/index.ts): niente server qui dentro.
// `npm run dev` ascolta su tutta la rete di casa (`--host`), così l'app in
// sviluppo si apre anche dal telefono.

export default defineConfig({
  base: '/Logger/',
  plugins: [
    react(),
    tailwindcss(),
    // PWA come nelle altre app: installabile, con la shell dell'app in cache.
    // I dati non passano dal service worker: le righe senza rete le tiene
    // l'app (src/dati/memoriaLocale.ts), e Supabase va sempre in rete. Le
    // icone le genera `npm run icone` da public/icona.svg.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icona.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Logger',
        short_name: 'Logger',
        description: 'Diario minimo di tutto quello che vuoi tenere a mente',
        lang: 'it',
        display: 'standalone',
        // Come l'intestazione e lo sfondo dell'app (src/index.css).
        theme_color: '#3f444e',
        background_color: '#f4f3ef',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
