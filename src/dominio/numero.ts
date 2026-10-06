// Il valore numerico (docs/02-funzionalita.md#registra): se l'ultimo valore di
// una chiave è un numero, magari con l'unità ("41000", "25€", "1,5 l"), dal
// telefono si apre la tastiera numerica e l'unità si aggiunge da sola: si
// scrive "27" e si salva "27€".

import { pulisci } from './voce'

const NUMERO = /^\d+(?:[.,]\d+)?$/
/** Un numero seguito, se c'è, da un'unità breve senza cifre (con o senza spazio). */
const CON_UNITA = /^\d+(?:[.,]\d+)?(\s?[^\d\s][^\d]{0,7})?$/

/** L'unità dell'ultimo valore ("" se è un numero nudo), o `null` se l'ultimo valore non è un numero. */
export function unitaDi(ultimo: string | null): string | null {
  if (ultimo === null) return null
  const trovato = CON_UNITA.exec(pulisci(ultimo))
  return trovato ? (trovato[1] ?? '') : null
}

export function eNumero(testo: string): boolean {
  return NUMERO.test(pulisci(testo))
}

/** Il valore da salvare: un numero nudo prende l'unità; tutto il resto resta com'è. */
export function conUnita(scritto: string, unita: string | null): string {
  return unita && eNumero(scritto) ? pulisci(scritto) + unita : scritto
}
