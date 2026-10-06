// L'API della prova in locale (docs/03-architettura.md#come-funziona), senza
// HTTP di mezzo: riceve metodo, indirizzo e corpo già letto e restituisce stato
// e corpo. Così i test la chiamano direttamente, e il plugin di Vite fa solo da
// tramite.

import type { Archivio } from '../src/dati/archivio.ts'
import { validaVoce } from '../src/dominio/voce.ts'

export interface Richiesta {
  metodo: string
  /** Percorso e query, es. `/api/voci?limite=100`. */
  url: string
  /** Il corpo già letto, se c'è. */
  corpo?: string
}

export interface Risposta {
  stato: number
  corpo?: unknown
}

export const LIMITE_PREDEFINITO = 100
export const LIMITE_MASSIMO = 500

const RIGA = /^\/api\/voci\/([^/]+)$/

function errore(stato: number, messaggio: string): Risposta {
  return { stato, corpo: { errore: messaggio } }
}

export async function gestisci(archivio: Archivio, { metodo, url, corpo }: Richiesta): Promise<Risposta> {
  const indirizzo = new URL(url, 'http://logger.locale')
  const percorso = indirizzo.pathname.replace(/\/$/, '')

  if (percorso === '/api/voci') {
    if (metodo !== 'GET') return errore(405, 'Metodo non ammesso')
    const limite = Number(indirizzo.searchParams.get('limite') ?? LIMITE_PREDEFINITO)
    if (!Number.isInteger(limite) || limite < 1 || limite > LIMITE_MASSIMO) {
      return errore(400, `Il limite va da 1 a ${LIMITE_MASSIMO}`)
    }
    const prima = indirizzo.searchParams.get('prima') ?? undefined
    if (prima !== undefined && Number.isNaN(Date.parse(prima))) return errore(400, 'Data non valida')
    return {
      stato: 200,
      corpo: await archivio.leggi({
        limite,
        prima: prima && new Date(prima).toISOString(),
        // `?soggetto=moto&soggetto=Moto`: solo quel diario. Senza, tutte le righe.
        soggetti: indirizzo.searchParams.has('soggetto') ? indirizzo.searchParams.getAll('soggetto') : undefined,
      }),
    }
  }

  if (percorso === '/api/usi') {
    if (metodo !== 'GET') return errore(405, 'Metodo non ammesso')
    return { stato: 200, corpo: await archivio.usi() }
  }

  const riga = RIGA.exec(percorso)
  if (riga) {
    const id = decodeURIComponent(riga[1]).toLowerCase()
    if (metodo === 'DELETE') {
      await archivio.elimina(id)
      return { stato: 204 }
    }
    if (metodo === 'PUT') {
      let dati: unknown
      try {
        dati = JSON.parse(corpo ?? '')
      } catch {
        return errore(400, 'Il corpo non è JSON')
      }
      const esito = validaVoce(dati)
      if (!esito.ok) return errore(400, esito.errore)
      if (esito.voce.id !== id) return errore(400, "L'id dell'indirizzo e quello della riga non coincidono")
      await archivio.salva(esito.voce)
      return { stato: 200, corpo: esito.voce }
    }
    return errore(405, 'Metodo non ammesso')
  }

  return errore(404, 'Rotta sconosciuta')
}
