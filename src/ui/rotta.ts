import { useSyncExternalStore } from 'react'

/**
 * Le pagine, raggiunte con l'hash come nelle altre app (docs/03-architettura.md):
 * `#/` è Registra, la pagina principale, `#/diario` è il Diario, `#/installa`
 * sono le istruzioni per installare l'app. Con l'hash,
 * nella Fase 2 GitHub Pages non vedrà mai le rotte.
 */
export type Rotta = 'registra' | 'diario' | 'installa'

export const indirizzi: Record<Rotta, string> = {
  registra: '#/',
  diario: '#/diario',
  installa: '#/installa',
}

/** Qualunque hash sconosciuto porta a Registra. */
function leggi(): Rotta {
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (hash === 'diario' || hash === 'installa') return hash
  return 'registra'
}

function iscriviti(avvisa: () => void) {
  window.addEventListener('hashchange', avvisa)
  return () => window.removeEventListener('hashchange', avvisa)
}

export function useRotta(): Rotta {
  return useSyncExternalStore(iscriviti, leggi, () => 'registra' as Rotta)
}
