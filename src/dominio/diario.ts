// Le date del diario (docs/02-funzionalita.md#diario): le giornate della
// timeline e, per le card, quando è stata scritta l'ultima riga.

import type { Voce } from './voce'

/** `fuso` serve ai test; nell'app è quello del dispositivo. */
function formati(fuso?: string) {
  return {
    giorno: new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }),
    data: new Intl.DateTimeFormat('it-IT', { timeZone: fuso, day: '2-digit', month: '2-digit', year: 'numeric' }),
    ora: new Intl.DateTimeFormat('it-IT', { timeZone: fuso, hour: '2-digit', minute: '2-digit' }),
  }
}

/** Il giorno prima di `AAAA-MM-GG`, sul calendario (senza fusi né ore legali di mezzo). */
function giornoPrima(giorno: string): string {
  const d = new Date(`${giorno}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** La data di una riga, "02/10/2026", nel fuso di chi guarda. */
export function data(voce: Voce, fuso?: string): string {
  return formati(fuso).data.format(new Date(voce.quando))
}

/** Una tappa della timeline: le righe di una stessa giornata. */
export interface Giornata {
  data: string
  voci: Voce[]
}

/** Le righe, già dalla più recente, divise per giornata nell'ordine in cui arrivano. */
export function perGiornata(voci: readonly Voce[], fuso?: string): Giornata[] {
  const giornate: Giornata[] = []
  for (const voce of voci) {
    const d = data(voce, fuso)
    const ultima = giornate.at(-1)
    if (ultima?.data === d) ultima.voci.push(voce)
    else giornate.push({ data: d, voci: [voce] })
  }
  return giornate
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
