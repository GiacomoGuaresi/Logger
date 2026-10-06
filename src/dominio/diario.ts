// Il diario raggruppato per giorno (docs/02-funzionalita.md#diario): "Oggi",
// "Ieri", poi "lunedì 5 ottobre", con l'anno solo se non è quello corrente.

import type { Voce } from './voce'

export interface Giorno {
  /** `AAAA-MM-GG` nel fuso orario di chi guarda. */
  chiave: string
  titolo: string
  voci: Voce[]
}

/** `fuso` serve ai test; nell'app è quello del dispositivo. */
function formati(fuso?: string) {
  return {
    giorno: new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }),
    titolo: new Intl.DateTimeFormat('it-IT', { timeZone: fuso, weekday: 'long', day: 'numeric', month: 'long' }),
    titoloConAnno: new Intl.DateTimeFormat('it-IT', { timeZone: fuso, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    ora: new Intl.DateTimeFormat('it-IT', { timeZone: fuso, hour: '2-digit', minute: '2-digit' }),
  }
}

/** Il giorno prima di `AAAA-MM-GG`, sul calendario (senza fusi né ore legali di mezzo). */
function giornoPrima(giorno: string): string {
  const d = new Date(`${giorno}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Le righe, già dalla più recente, divise per giorno nell'ordine in cui arrivano. */
export function perGiorno(voci: readonly Voce[], adesso: Date = new Date(), fuso?: string): Giorno[] {
  const f = formati(fuso)
  const oggi = f.giorno.format(adesso)
  const ieri = giornoPrima(oggi)
  const giorni: Giorno[] = []

  for (const voce of voci) {
    const quando = new Date(voce.quando)
    const chiave = f.giorno.format(quando)
    let giorno = giorni.at(-1)
    if (giorno?.chiave !== chiave) {
      const titolo =
        chiave === oggi
          ? 'Oggi'
          : chiave === ieri
            ? 'Ieri'
            : (chiave.slice(0, 4) === oggi.slice(0, 4) ? f.titolo : f.titoloConAnno).format(quando)
      giorno = { chiave, titolo, voci: [] }
      giorni.push(giorno)
    }
    giorno.voci.push(voce)
  }
  return giorni
}

/** L'ora di una riga, "08:12". */
export function ora(voce: Voce, fuso?: string): string {
  return formati(fuso).ora.format(new Date(voce.quando))
}

/**
 * Quando è stata scritta l'ultima riga, in breve per le card dei diari:
 * "oggi 08:12", "ieri 18:40", "5 ott", "31 dic 2025".
 */
export function quandoBreve(quando: string, adesso: Date = new Date(), fuso?: string): string {
  const f = formati(fuso)
  const data = new Date(quando)
  const giorno = f.giorno.format(data)
  const oggi = f.giorno.format(adesso)
  if (giorno === oggi) return `oggi ${f.ora.format(data)}`
  if (giorno === giornoPrima(oggi)) return `ieri ${f.ora.format(data)}`
  const breve = new Intl.DateTimeFormat('it-IT', {
    timeZone: fuso,
    day: 'numeric',
    month: 'short',
    year: giorno.slice(0, 4) === oggi.slice(0, 4) ? undefined : 'numeric',
  })
  return breve.format(data)
}
