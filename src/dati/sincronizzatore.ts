// Le righe tenute in pari tra lo schermo, il dispositivo e l'archivio
// (docs/03-architettura.md#senza-rete), come il Sincronizzatore di Grocery ma
// più semplice. Niente React qui dentro, così il giro senza rete → con rete si
// prova nei test; `useVoci` ci si appoggia.
//
// Tiene due cose: il riepilogo degli usi (le card dei diari e le scelte di
// Registra) e il diario aperto, uno per soggetto. Ogni scrittura va subito a
// schermo e in coda nella memoria del dispositivo, poi parte per l'archivio.
// Senza rete resta in coda, e riparte alla prossima occasione: una riga nuova,
// `aggiorna()` (rete che torna, app in primo piano, il controllo periodico).

import { accoda, applica, conVoce, inAttesa, type Scrittura } from '../dominio/coda'
import { soggettiRiassunti, type Soggetto } from '../dominio/soggetti'
import { confrontabile, conVoce as usiConVoce, type Uso } from '../dominio/suggerimenti'
import type { Voce } from '../dominio/voce'
import { ErroreRete, type Archivio } from './archivio'
import type { MemoriaLocale } from './memoriaLocale'

/** Quante righe si leggono per volta: "Mostra altre" ne carica altrettante. */
export const PAGINA = 100

export type Stato<T> = { fase: 'caricamento' } | { fase: 'errore'; messaggio: string } | ({ fase: 'pronto' } & T)

/** `finite`: l'ultima pagina è arrivata incompleta, prima non c'è altro. */
export type StatoVoci = Stato<{ voci: Voce[]; finite: boolean }>

export interface Istantanea {
  /** I diari, uno per soggetto, con le righe ancora in coda già contate. */
  soggetti: Stato<{ elenco: Soggetto[] }>
  /** Il riepilogo di soggetti e chiavi, per le scelte di Registra. */
  usi: Uso[]
  /** Il diario aperto: il soggetto (come scritto nell'indirizzo) e le sue righe. */
  diario: { soggetto: string; stato: StatoVoci } | null
  /** Gli id delle righe con una scrittura non ancora arrivata. */
  inAttesa: ReadonlySet<string>
  /** L'ultimo tentativo di parlare con l'archivio è fallito per la rete. */
  senzaRete: boolean
  /** L'ultima scrittura rifiutata dall'archivio, tolta dalla coda: da segnalare. */
  rifiutata: string | null
}

interface DiarioAperto {
  /** Come si confronta il soggetto: "moto" e "Moto" sono lo stesso diario. */
  chiave: string
  soggetto: string
  voci: Voce[] | null
  finite: boolean
  errore: string | null
}

export class Sincronizzatore {
  /** Il riepilogo confermato dall'archivio (o, prima della prima lettura, quello in memoria). */
  private usi: Uso[] | null
  private erroreUsi: string | null = null
  private aperto: DiarioAperto | null = null
  private coda: Scrittura[]
  private senzaRete = false
  private rifiutata: string | null = null
  private istantanea: Istantanea
  // Tutto quello che parla con l'archivio passa di qui, uno alla volta: le
  // scritture arrivano nell'ordine in cui sono state fatte.
  private fila: Promise<void> = Promise.resolve()
  private ascolti = new Set<(istantanea: Istantanea) => void>()

  constructor(
    private readonly archivio: Archivio,
    private readonly memoria: MemoriaLocale,
  ) {
    this.coda = memoria.leggiCoda()
    this.usi = memoria.leggiUsi()
    this.istantanea = this.fotografa()
  }

  leggi(): Istantanea {
    return this.istantanea
  }

  /** `ascolta` riceve ogni istantanea nuova. Restituisce come smettere. */
  iscriviti(ascolta: (istantanea: Istantanea) => void): () => void {
    this.ascolti.add(ascolta)
    return () => this.ascolti.delete(ascolta)
  }

  /** Manda la coda, poi rilegge il riepilogo e il diario aperto. */
  aggiorna(): Promise<void> {
    return this.inFila(async () => {
      await this.svuotaCoda()
      await this.leggiUsi()
      if (this.aperto) await this.leggiDiario(this.aperto)
    })
  }

  /**
   * Apre il diario di `soggetto` (come scritto nell'indirizzo): subito con le
   * righe in memoria, se ci sono, poi con quelle dell'archivio.
   */
  apriDiario(soggetto: string): Promise<void> {
    const chiave = confrontabile(soggetto)
    if (this.aperto?.chiave === chiave) {
      this.aperto.soggetto = soggetto
      this.pubblica()
      return this.fila
    }
    this.aperto = { chiave, soggetto, voci: this.memoria.leggiDiario(chiave), finite: false, errore: null }
    this.pubblica()
    const aperto = this.aperto
    return this.inFila(async () => {
      // Se intanto se n'è aperto un altro, questo non serve più.
      if (this.aperto === aperto) await this.leggiDiario(aperto)
    })
  }

  chiudiDiario(): void {
    this.aperto = null
    this.pubblica()
  }

  /** La pagina dopo del diario aperto. Se va male lancia, e chi l'ha chiesta lo dice. */
  async mostraAltre(): Promise<void> {
    const aperto = this.aperto
    if (!aperto?.voci || aperto.finite) return
    const altre = await this.archivio.leggi({
      soggetti: this.forme(aperto.chiave),
      limite: PAGINA,
      prima: aperto.voci.at(-1)?.quando,
    })
    aperto.voci = altre.reduce(conVoce, aperto.voci)
    aperto.finite = altre.length < PAGINA
    this.pubblica()
  }

  salva(voce: Voce): void {
    this.scrivi({ tipo: 'salva', voce })
  }

  /**
   * Riscrive una riga che c'era già, con lo stesso id: corretta dal diario, o
   * rimessa com'era dopo un'eliminazione (Annulla). Non conta come riga nuova:
   * dopo l'invio il riepilogo si rilegge, come dopo un'eliminazione.
   */
  modifica(voce: Voce): void {
    this.scrivi({ tipo: 'salva', voce, modifica: true })
  }

  elimina(id: string): void {
    this.scrivi({ tipo: 'elimina', id })
  }

  /** Quando tutto quello che è partito finora ha finito, riuscito o no. */
  finito(): Promise<void> {
    return this.fila
  }

  /** Le forme scritte di un soggetto, da chiedere all'archivio; almeno quella cercata. */
  private forme(chiave: string): string[] {
    const forme = (this.usi ?? []).filter((u) => confrontabile(u.soggetto) === chiave).map((u) => u.soggetto)
    const tutte = new Set(forme)
    if (this.aperto?.chiave === chiave) tutte.add(this.aperto.soggetto)
    return [...tutte]
  }

  private async leggiUsi(): Promise<void> {
    try {
      this.usi = await this.archivio.usi()
      this.erroreUsi = null
      this.memoria.salvaUsi(this.usi)
    } catch (errore) {
      this.erroreUsi = (errore as Error).message
      throw errore
    }
  }

  private async leggiDiario(aperto: DiarioAperto): Promise<void> {
    try {
      const lette = await this.archivio.leggi({ soggetti: this.forme(aperto.chiave), limite: PAGINA })
      aperto.voci = lette
      aperto.finite = lette.length < PAGINA
      aperto.errore = null
      this.memoria.salvaDiario(aperto.chiave, lette)
    } catch (errore) {
      aperto.errore = (errore as Error).message
      throw errore
    }
  }

  private scrivi(scrittura: Scrittura): void {
    // Prima la coda in memoria: se l'app si chiude subito dopo, la scrittura parte alla riapertura.
    this.coda = accoda(this.coda, scrittura)
    this.memoria.salvaCoda(this.coda)
    this.rifiutata = null
    this.pubblica()
    void this.inFila(async () => {
      // Un'eliminazione o una modifica cambiano i conti e forse l'ultimo valore: il riepilogo si rilegge.
      if (await this.svuotaCoda()) await this.leggiUsi()
    })
  }

  /**
   * Manda le scritture dalla più vecchia. Senza rete si ferma e le tiene; una
   * scrittura rifiutata si lascia perdere, perché riprovarla darebbe lo stesso
   * errore e bloccherebbe le altre dietro di lei. Dice se il riepilogo va
   * riletto: è arrivata almeno un'eliminazione o una modifica.
   */
  private async svuotaCoda(): Promise<boolean> {
    let daRileggere = false
    while (this.coda.length > 0) {
      const scrittura = this.coda[0]
      const aperto = this.aperto
      try {
        if (scrittura.tipo === 'salva') {
          await this.archivio.salva(scrittura.voce)
          if (scrittura.modifica) daRileggere = true
          else if (this.usi) this.usi = usiConVoce(this.usi, scrittura.voce)
          if (aperto?.voci && confrontabile(scrittura.voce.soggetto) === aperto.chiave) {
            aperto.voci = conVoce(aperto.voci, scrittura.voce)
          }
        } else {
          await this.archivio.elimina(scrittura.id)
          daRileggere = true
          if (aperto?.voci) aperto.voci = aperto.voci.filter((v) => v.id !== scrittura.id)
        }
      } catch (errore) {
        if (errore instanceof ErroreRete) throw errore
        console.error('Scrittura rifiutata, la lascio perdere', scrittura, errore)
        this.rifiutata = (errore as Error).message
      }
      // Tolta solo se è ancora lei la prima: intanto potrebbe essere stata sostituita.
      if (this.coda[0] === scrittura) this.coda = this.coda.slice(1)
      this.memoria.salvaCoda(this.coda)
      if (this.usi) this.memoria.salvaUsi(this.usi)
      if (aperto?.voci) this.memoria.salvaDiario(aperto.chiave, aperto.voci.slice(0, PAGINA))
      this.senzaRete = false
      this.pubblica()
    }
    return daRileggere
  }

  private inFila(lavoro: () => Promise<void>): Promise<void> {
    this.fila = this.fila.then(async () => {
      try {
        await lavoro()
        this.senzaRete = false
      } catch (errore) {
        if (errore instanceof ErroreRete) this.senzaRete = true
        else console.error(errore)
      }
      this.pubblica()
    })
    return this.fila
  }

  private fotografa(): Istantanea {
    // Le righe in coda contano già: appena scritta, una chiave nuova è tra le scelte
    // e un soggetto nuovo ha la sua card. Le modifiche no: la riga c'era già.
    const usi = this.coda.reduce((u, s) => (s.tipo === 'salva' && !s.modifica ? usiConVoce(u, s.voce) : u), this.usi ?? [])
    const soggetti: Istantanea['soggetti'] =
      this.usi || usi.length > 0
        ? { fase: 'pronto', elenco: soggettiRiassunti(usi) }
        : this.erroreUsi
          ? { fase: 'errore', messaggio: this.erroreUsi }
          : { fase: 'caricamento' }

    let diario: Istantanea['diario'] = null
    if (this.aperto) {
      const { chiave, soggetto, voci, finite, errore } = this.aperto
      const delDiario = this.coda.filter((s) => s.tipo === 'elimina' || confrontabile(s.voce.soggetto) === chiave)
      diario = {
        soggetto,
        stato: voci
          ? { fase: 'pronto', voci: applica(voci, delDiario), finite }
          : // Mai letto, ma con righe scritte qui senza rete: intanto si vedono quelle.
            errore && delDiario.some((s) => s.tipo === 'salva')
            ? { fase: 'pronto', voci: applica([], delDiario), finite: false }
            : errore
            ? { fase: 'errore', messaggio: errore }
            : { fase: 'caricamento' },
      }
    }
    return { soggetti, usi, diario, inAttesa: inAttesa(this.coda), senzaRete: this.senzaRete, rifiutata: this.rifiutata }
  }

  private pubblica(): void {
    this.istantanea = this.fotografa()
    for (const ascolta of this.ascolti) ascolta(this.istantanea)
  }
}
