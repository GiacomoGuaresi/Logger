// Dove stanno le righe (docs/03-architettura.md#archivio-sostituibile). Il resto
// dell'app conosce solo questa interfaccia: sotto c'è Supabase
// (archivioSupabase.ts), nei test un archivio in memoria. Cosa ci si aspetta da
// qualunque archivio lo dicono i test di contratto (contratto.ts).

import type { Uso } from '../dominio/suggerimenti.ts'
import type { Voce } from '../dominio/voce.ts'

export interface OpzioniLettura {
  /**
   * Solo le righe di questi soggetti, scritti esattamente così: le forme di un
   * soggetto ("moto", "Moto") le raccoglie il dominio (`soggettiRiassunti`).
   * Senza, le righe di tutti.
   */
  soggetti?: readonly string[]
  /** Solo le righe scritte prima di questa data (ISO): la pagina dopo di "Mostra altre". */
  prima?: string
  limite: number
}

export interface Archivio {
  /** Le righe dalla più recente. */
  leggi(opzioni: OpzioniLettura): Promise<Voce[]>
  /**
   * Il riepilogo di tutte le righe, una voce per coppia soggetto · chiave scritta
   * esattamente così: da qui vengono le scelte di Registra e l'ultimo valore.
   */
  usi(): Promise<Uso[]>
  /** Scrive la riga; se l'id c'è già la sovrascrive. */
  salva(voce: Voce): Promise<void>
  /** Toglie la riga; se non c'è, non succede niente. */
  elimina(id: string): Promise<void>
}

/** L'archivio non risponde (rete assente, sessione scaduta, server giù): si potrà riprovare. */
export class ErroreRete extends Error {
  constructor(messaggio = 'Il server non risponde') {
    super(messaggio)
    this.name = 'ErroreRete'
  }
}

/** Il server ha risposto di no (dati non validi): riprovare non serve. */
export class ErroreRifiutato extends Error {
  constructor(messaggio: string) {
    super(messaggio)
    this.name = 'ErroreRifiutato'
  }
}
