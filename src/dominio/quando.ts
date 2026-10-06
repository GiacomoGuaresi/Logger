// La data di una riga scelta a mano (docs/02-funzionalita.md#registra): di
// solito è "adesso", ma si può registrare qualcosa a posteriori. Il campo è un
// `datetime-local` nativo, che parla in ora locale senza fuso.

/** `2026-10-06T18:40`, l'ora locale di `data` nel formato di `datetime-local`. */
export function perCampo(data: Date): string {
  const due = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${due(data.getMonth() + 1)}-${due(data.getDate())}T${due(data.getHours())}:${due(data.getMinutes())}`
}

/** Il valore di un `datetime-local` come data, o `null` se è vuoto o rovinato. */
export function daCampo(testo: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(testo)) return null
  // Senza fuso, `Date` lo legge in ora locale: proprio quello che il campo intende.
  const data = new Date(testo)
  return Number.isNaN(data.getTime()) ? null : data
}

/** Lo stesso momento, un giorno prima sul calendario (l'ora legale non lo sposta). */
export function ilGiornoPrima(data: Date): Date {
  const prima = new Date(data)
  prima.setDate(prima.getDate() - 1)
  return prima
}

/**
 * La data scelta, in breve: "Oggi 18:40", "Ieri 18:40", "02/10 18:40",
 * "31/12/2025 18:40". `fuso` serve ai test; nell'app è quello del dispositivo.
 */
export function etichetta(data: Date, adesso: Date = new Date(), fuso?: string): string {
  const giorno = new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' })
  const ora = new Intl.DateTimeFormat('it-IT', { timeZone: fuso, hour: '2-digit', minute: '2-digit' }).format(data)
  const g = giorno.format(data)
  const oggi = giorno.format(adesso)
  if (g === oggi) return `Oggi ${ora}`
  if (g === giorno.format(new Date(adesso.getTime() - 86_400_000))) return `Ieri ${ora}`
  const stessoAnno = g.slice(0, 4) === oggi.slice(0, 4)
  const breve = new Intl.DateTimeFormat('it-IT', {
    timeZone: fuso,
    day: '2-digit',
    month: '2-digit',
    year: stessoAnno ? undefined : 'numeric',
  }).format(data)
  return `${breve} ${ora}`
}
