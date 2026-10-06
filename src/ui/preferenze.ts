// Le comodità di questo dispositivo, in localStorage: se il browser non lo
// concede (navigazione privata), l'app funziona lo stesso e se ne dimentica.

const CHIAVE_SOGGETTO = 'logger.soggetto'

/** L'ultimo soggetto usato su questo dispositivo (docs/02-funzionalita.md#registra). */
export function leggiUltimoSoggetto(): string {
  try {
    return localStorage.getItem(CHIAVE_SOGGETTO) ?? ''
  } catch {
    return ''
  }
}

export function salvaUltimoSoggetto(soggetto: string): void {
  try {
    localStorage.setItem(CHIAVE_SOGGETTO, soggetto)
  } catch {
    // Pazienza: la prossima volta il soggetto si riscrive.
  }
}
