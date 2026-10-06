// Le scritture non ancora arrivate all'archivio (docs/03-architettura.md#senza-rete).
// Ognuna riguarda una riga sola, per id: rimandarla non fa danni, quindi la coda
// si può riprovare quante volte serve.

import type { Voce } from './voce'

export type Scrittura =
  /** `modifica`: la riga c'era già (corretta, o rimessa con Annulla), quindi non è una riga in più nei conti. */
  | { tipo: 'salva'; voce: Voce; modifica?: true }
  | { tipo: 'elimina'; id: string }

export function idDi(scrittura: Scrittura): string {
  return scrittura.tipo === 'salva' ? scrittura.voce.id : scrittura.id
}

/**
 * Aggiunge una scrittura in fondo. Quelle già in coda per la stessa riga non
 * servono più: conta solo l'ultima (salvare due volte, o salvare e poi eliminare).
 */
export function accoda(coda: readonly Scrittura[], scrittura: Scrittura): Scrittura[] {
  const id = idDi(scrittura)
  return [...coda.filter((s) => idDi(s) !== id), scrittura]
}

/** Inserisce o sostituisce `voce` tenendo l'ordine dalla più recente. */
export function conVoce(voci: readonly Voce[], voce: Voce): Voce[] {
  return [...voci.filter((v) => v.id !== voce.id), voce].sort(
    (a, b) => b.quando.localeCompare(a.quando) || b.id.localeCompare(a.id),
  )
}

/** Le righe come appariranno quando la coda sarà arrivata. */
export function applica(voci: readonly Voce[], coda: readonly Scrittura[]): Voce[] {
  return coda.reduce<Voce[]>(
    (risultato, s) => (s.tipo === 'salva' ? conVoce(risultato, s.voce) : risultato.filter((v) => v.id !== s.id)),
    [...voci],
  )
}

/** Gli id delle righe con una scrittura in coda: nel diario hanno il segno "da inviare". */
export function inAttesa(coda: readonly Scrittura[]): ReadonlySet<string> {
  return new Set(coda.map(idDi))
}
