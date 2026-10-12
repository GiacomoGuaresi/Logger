// Punto d'ingresso dei dati: l'unico posto che sa quale archivio c'è sotto
// (docs/03-architettura.md#archivio-sostituibile). Un solo client Supabase,
// sullo schema `logger` del progetto di produzione di Grocery: accesso e query
// condividono la sessione.

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AccessoSupabase, type Accesso } from './accesso'
import { ErroreRete, type Archivio } from './archivio'
import { ArchivioSupabase } from './archivioSupabase'
import { memoriaDelBrowser } from './memoriaLocale'
import { Sincronizzatore } from './sincronizzatore'

export type { Accesso, EsitoAccesso } from './accesso'
export type { Archivio, OpzioniLettura } from './archivio'
export { ErroreRete, ErroreRifiutato } from './archivio'
export { PAGINA, type Istantanea, type StatoVoci } from './sincronizzatore'

let connessione: { accesso: Accesso; archivio: Archivio } | null = null

/**
 * Il client nasce alla prima richiesta, non all'import: senza variabili l'app
 * mostra "non riesco a collegarmi" invece di non partire affatto.
 *
 * La sessione sta nei cookie con percorso `/`: Grocery, Projects e Adventures
 * stanno sulla stessa origine e sullo stesso progetto Supabase, quindi con lo
 * stesso percorso le app condividono la sessione (docs/04-sicurezza.md).
 */
function connetti() {
  if (connessione) return connessione
  const url = import.meta.env.VITE_SUPABASE_URL
  const chiave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const email = import.meta.env.VITE_SUPABASE_EMAIL
  if (!url || !chiave || !email) {
    throw new Error('Mancano VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY o VITE_SUPABASE_EMAIL: vedi .env.example')
  }
  const client = createBrowserClient(url, chiave, {
    cookieOptions: { path: '/' },
    db: { schema: 'logger' },
  }) as unknown as SupabaseClient
  connessione = { accesso: new AccessoSupabase(client, email), archivio: new ArchivioSupabase(client) }
  return connessione
}

/** Chi può entrare: serve la sessione aperta dalla passphrase. */
export function accesso(): Accesso {
  return connetti().accesso
}

/** Un client che non si riesce a creare è come un server che non risponde: la coda resta. */
function archivioConnesso(): Archivio {
  try {
    return connetti().archivio
  } catch (e) {
    throw new ErroreRete((e as Error).message)
  }
}

const archivio: Archivio = {
  leggi: (opzioni) => archivioConnesso().leggi(opzioni),
  usi: () => archivioConnesso().usi(),
  salva: (voce) => archivioConnesso().salva(voce),
  elimina: (id) => archivioConnesso().elimina(id),
}

/** Le righe tenute in pari tra schermo, dispositivo e archivio: una sola per l'app. */
export const sincronizzatore = new Sincronizzatore(archivio, memoriaDelBrowser())
