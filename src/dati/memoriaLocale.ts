// Quello che il dispositivo tiene per sé (docs/03-architettura.md#senza-rete):
// il riepilogo degli usi e le ultime righe di ogni diario, per aprire l'app
// subito, e le scritture non ancora arrivate all'archivio. Come in Grocery, sta in localStorage dietro un'interfaccia
// che nei test fa una Map.

import type { Scrittura } from '../dominio/coda'
import type { Uso } from '../dominio/suggerimenti'
import { validaVoce, type Voce } from '../dominio/voce'

/** Il pezzo di `localStorage` che serve qui. */
export interface Scaffale {
  getItem(chiave: string): string | null
  setItem(chiave: string, valore: string): void
}

const CHIAVE_DIARI = 'logger.diari'
const CHIAVE_CODA = 'logger.coda'
const CHIAVE_USI = 'logger.usi'

/** Una riga salvata male (o da una versione vecchia) si lascia perdere. */
function riga(valore: unknown): Voce | null {
  const esito = validaVoce(valore)
  return esito.ok ? esito.voce : null
}

function uso(valore: unknown): Uso | null {
  const u = valore as Partial<Record<keyof Uso, unknown>> | null
  if (typeof u?.soggetto !== 'string' || typeof u.chiave !== 'string') return null
  if (typeof u.volte !== 'number' || typeof u.ultimaVolta !== 'string') return null
  const ultimo = u.ultimoValore as { valore?: unknown; quando?: unknown } | null
  return {
    soggetto: u.soggetto,
    chiave: u.chiave,
    volte: u.volte,
    ultimaVolta: u.ultimaVolta,
    ultimoValore:
      typeof ultimo?.valore === 'string' && typeof ultimo.quando === 'string'
        ? { valore: ultimo.valore, quando: ultimo.quando }
        : null,
  }
}

function scrittura(valore: unknown): Scrittura | null {
  const s = valore as Partial<Record<string, unknown>> | null
  if (s?.tipo === 'salva') {
    const voce = riga(s.voce)
    if (!voce) return null
    return s.modifica === true ? { tipo: 'salva', voce, modifica: true } : { tipo: 'salva', voce }
  }
  if (s?.tipo === 'elimina' && typeof s.id === 'string') return { tipo: 'elimina', id: s.id }
  return null
}

export class MemoriaLocale {
  constructor(private readonly scaffale: Scaffale | null) {}

  /** Le ultime righe viste di un diario (`chiave`: il soggetto confrontabile); `null` se non c'è niente. */
  leggiDiario(chiave: string): Voce[] | null {
    const diari = this.leggi(CHIAVE_DIARI) as Record<string, unknown> | null
    const voci = diari?.[chiave]
    if (!Array.isArray(voci)) return null
    return voci.map(riga).filter((v) => v !== null)
  }

  salvaDiario(chiave: string, voci: readonly Voce[]): void {
    const diari = this.leggi(CHIAVE_DIARI)
    const tutti = typeof diari === 'object' && diari !== null && !Array.isArray(diari) ? (diari as Record<string, unknown>) : {}
    this.scrivi(CHIAVE_DIARI, { ...tutti, [chiave]: voci })
  }

  /** Il riepilogo di soggetti e chiavi, per le card e le scelte anche senza rete; `null` se non c'è. */
  leggiUsi(): Uso[] | null {
    const usi = this.leggi(CHIAVE_USI)
    if (!Array.isArray(usi)) return null
    return usi.map(uso).filter((u) => u !== null)
  }

  salvaUsi(usi: readonly Uso[]): void {
    this.scrivi(CHIAVE_USI, usi)
  }

  /** Le scritture in attesa, dalla più vecchia. */
  leggiCoda(): Scrittura[] {
    const coda = this.leggi(CHIAVE_CODA)
    if (!Array.isArray(coda)) return []
    return coda.map(scrittura).filter((s) => s !== null)
  }

  salvaCoda(coda: readonly Scrittura[]): void {
    this.scrivi(CHIAVE_CODA, coda)
  }

  /** Un valore illeggibile vale quanto uno assente. */
  private leggi(chiave: string): unknown {
    try {
      const testo = this.scaffale?.getItem(chiave)
      return testo ? JSON.parse(testo) : null
    } catch (errore) {
      console.warn(`Memoria locale illeggibile: ${chiave}`, errore)
      return null
    }
  }

  /** Senza spazio (o in navigazione privata) si va avanti lo stesso, solo online. */
  private scrivi(chiave: string, valore: unknown): void {
    try {
      this.scaffale?.setItem(chiave, JSON.stringify(valore))
    } catch (errore) {
      console.warn(`Memoria locale non scrivibile: ${chiave}`, errore)
    }
  }
}

/** La memoria di questo browser; senza `localStorage` non ricorda niente. */
export function memoriaDelBrowser(): MemoriaLocale {
  try {
    return new MemoriaLocale(globalThis.localStorage ?? null)
  } catch {
    // Alcuni browser, coi dati del sito bloccati, lanciano già leggendo la proprietà.
    return new MemoriaLocale(null)
  }
}
