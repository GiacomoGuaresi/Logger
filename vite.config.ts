import { existsSync, readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { pluginApi } from './server/pluginApi.ts'

// Prova in locale (docs/05-esecuzione.md): `npm run dev` e `npm run prova`
// ascoltano su tutta la rete di casa (`--host`), così l'app si apre anche dal
// telefono all'IP del Mac. Le rotte `/api` e il database SQLite stanno dentro
// Vite stesso (server/pluginApi.ts). Niente `base`: non c'è GitHub Pages fino
// alla Fase 2.

// HTTPS solo se `npm run certificati` ha creato il certificato: serve al
// telefono per installare la PWA. Senza, tutto va in HTTP come prima.
const https = existsSync('certificati/cert.pem')
  ? { cert: readFileSync('certificati/cert.pem'), key: readFileSync('certificati/key.pem') }
  : undefined

export default defineConfig({
  server: { https },
  preview: { https },
  plugins: [
    react(),
    tailwindcss(),
    pluginApi('dati/logger.db'),
    // PWA come nelle altre app: installabile, con la shell dell'app in cache.
    // I dati non passano dal service worker: le righe senza rete le tiene
    // l'app (src/dati/memoriaLocale.ts), e `/api` va sempre in rete. Le icone
    // le genera `npm run icone` da public/icona.svg.
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
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
  },
})
