import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Prova in locale (docs/05-esecuzione.md): `npm run dev` e `npm run prova`
// ascoltano su tutta la rete di casa (`--host`), così l'app si apre anche dal
// telefono all'IP del Mac. Niente `base`: non c'è GitHub Pages fino alla Fase 2.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
  },
})
