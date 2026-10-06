// Il piccolo server della prova in locale (docs/03-architettura.md): le rotte
// `/api` dentro Vite stesso, sia con `npm run dev` sia con `npm run prova`
// (vite preview). Un solo processo, una sola porta, per il Mac e il telefono.

import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import type { Archivio } from '../src/dati/archivio'
import { ArchivioSqlite } from './archivioSqlite'
import { gestisci } from './rotte'

/** Il corpo di una richiesta: al massimo 16 KB, una riga ne usa poche centinaia. */
const CORPO_MASSIMO = 16 * 1024

function leggiCorpo(req: IncomingMessage): Promise<string> {
  return new Promise((risolvi, rifiuta) => {
    let corpo = ''
    req.setEncoding('utf8')
    req.on('data', (pezzo: string) => {
      corpo += pezzo
      if (corpo.length > CORPO_MASSIMO) {
        rifiuta(new Error('Corpo troppo grande'))
        req.destroy()
      }
    })
    req.on('end', () => risolvi(corpo))
    req.on('error', rifiuta)
  })
}

function rispondi(res: ServerResponse, stato: number, corpo?: unknown) {
  res.statusCode = stato
  res.setHeader('Cache-Control', 'no-store')
  if (corpo === undefined) {
    res.end()
    return
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(corpo))
}

/** `percorso` è il file del database, relativo alla cartella del progetto. */
export function pluginApi(percorso = 'dati/logger.db'): Plugin {
  let archivio: Archivio | null = null
  let radice = process.cwd()

  const middleware = async (req: IncomingMessage, res: ServerResponse, avanti: () => void) => {
    if (!req.url?.startsWith('/api/') && req.url !== '/api') return avanti()
    try {
      // Il database si apre alla prima richiesta, non all'avvio di Vite: la
      // build e i test non lo toccano.
      archivio ??= ArchivioSqlite.apri(resolve(radice, percorso))
      const corpo = req.method === 'PUT' ? await leggiCorpo(req) : undefined
      const risposta = await gestisci(archivio, { metodo: req.method ?? 'GET', url: req.url, corpo })
      rispondi(res, risposta.stato, risposta.corpo)
    } catch (e) {
      console.error('[api]', e)
      rispondi(res, 500, { errore: 'Errore del server' })
    }
  }

  return {
    name: 'logger-api',
    configResolved(config) {
      radice = config.root
    },
    configureServer(server) {
      server.middlewares.use((req, res, avanti) => void middleware(req, res, avanti))
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, avanti) => void middleware(req, res, avanti))
    },
  }
}
