import { useSyncExternalStore } from 'react'

/**
 * Le pagine, raggiunte con l'hash come nelle altre app (docs/03-architettura.md):
 * `#/` è Registra, la pagina principale; `#/diario` è l'elenco dei diari, uno
 * per soggetto, e `#/diario/<soggetto>` il diario di quel soggetto;
 * `#/installa` sono le istruzioni per installare l'app. Con l'hash, nella
 * Fase 2 GitHub Pages non vedrà mai le rotte.
 */
export type Pagina = 'registra' | 'diario' | 'installa'

export interface Rotta {
  pagina: Pagina
  /** Solo nel diario di un soggetto: il soggetto com'è scritto nell'indirizzo. */
  soggetto?: string
}

export const indirizzi: Record<Pagina, string> = {
  registra: '#/',
  diario: '#/diario',
  installa: '#/installa',
}

export function indirizzoDiario(soggetto: string): string {
  return `#/diario/${encodeURIComponent(soggetto)}`
}

/** Qualunque hash sconosciuto porta a Registra. */
export function leggiRotta(hash: string): Rotta {
  const [pagina, ...resto] = hash.replace(/^#\/?/, '').split('/')
  if (pagina === 'installa') return { pagina: 'installa' }
  if (pagina !== 'diario') return { pagina: 'registra' }
  let soggetto = ''
  try {
    soggetto = decodeURIComponent(resto.join('/')).trim()
  } catch {
    // Un indirizzo rovinato a mano: si torna all'elenco dei diari.
  }
  return soggetto ? { pagina: 'diario', soggetto } : { pagina: 'diario' }
}

function iscriviti(avvisa: () => void) {
  window.addEventListener('hashchange', avvisa)
  return () => window.removeEventListener('hashchange', avvisa)
}

/** La rotta come stringa, perché `useSyncExternalStore` vuole valori stabili. */
const hash = () => window.location.hash

export function useRotta(): Rotta {
  return leggiRotta(useSyncExternalStore(iscriviti, hash, () => ''))
}
