import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { pluginApi } from './server/pluginApi.ts'

// Prova in locale (docs/05-esecuzione.md): `npm run dev` e `npm run prova`
// ascoltano su tutta la rete di casa (`--host`), così l'app si apre anche dal
// telefono all'IP del Mac. Le rotte `/api` e il database SQLite stanno dentro
// Vite stesso (server/pluginApi.ts). Niente `base`: non c'è GitHub Pages fino
// alla Fase 2.
export default defineConfig({
  plugins: [react(), tailwindcss(), pluginApi('dati/logger.db')],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
  },
})
