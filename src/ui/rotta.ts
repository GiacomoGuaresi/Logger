import { useSyncExternalStore } from 'react'

/**
 * Le pagine, raggiunte con l'hash come nelle altre app (docs/03-architettura.md):
 * `#/` è Registra, la pagina principale, e `#/registra/<soggetto>` Registra
 * con il soggetto già scelto (il "+ Riga" del diario); `#/diario` è l'elenco dei diari, uno
 * per soggetto, e `#/diario/<soggetto>` il diario di quel soggetto;
 * `#/installa` sono le istruzioni per installare l'app. Con l'hash, nella
 * Fase 2 GitHub Pages non vedrà mai le rotte.
 */
export type Pagina = 'registra' | 'diario' | 'installa'

export interface Rotta {
  pagina: Pagina
  /** Il diario di un soggetto, o Registra già su quel soggetto: il soggetto com'è scritto nell'indirizzo. */
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

export function indirizzoRegistra(soggetto: string): string {
  return `#/registra/${encodeURIComponent(soggetto)}`
}

/** Qualunque hash sconosciuto porta a Registra. */
export function leggiRotta(hash: string): Rotta {
  const [pagina, ...resto] = hash.replace(/^#\/?/, '').split('/')
  if (pagina === 'installa') return { pagina: 'installa' }
  const verso: Pagina = pagina === 'diario' ? 'diario' : 'registra'
  if (verso === 'registra' && pagina !== 'registra') return { pagina: 'registra' }
  let soggetto = ''
  try {
    soggetto = decodeURIComponent(resto.join('/')).trim()
  } catch {
    // Un indirizzo rovinato a mano: si torna all'elenco dei diari, o a Registra senza soggetto.
  }
  return soggetto ? { pagina: verso, soggetto } : { pagina: verso }
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
