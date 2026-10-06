import { useCallback, useEffect, useState } from 'react'
import { archivio } from '../dati'
import type { Voce } from '../dominio/voce'

/** Quante righe si leggono per volta: "Mostra altre" ne carica altrettante. */
export const PAGINA = 100

export type StatoVoci =
  | { fase: 'caricamento' }
  | { fase: 'errore'; messaggio: string }
  /** `finite`: l'ultima pagina è arrivata incompleta, prima non c'è altro. */
  | { fase: 'pronto'; voci: Voce[]; finite: boolean }

/** Inserisce o sostituisce `voce` tenendo l'ordine dalla più recente. */
function conVoce(voci: readonly Voce[], voce: Voce): Voce[] {
  return [...voci.filter((v) => v.id !== voce.id), voce].sort(
    (a, b) => b.quando.localeCompare(a.quando) || b.id.localeCompare(a.id),
  )
}

/**
 * Le righe del diario, condivise tra Registra (per i suggerimenti) e Diario.
 * Dopo un salvataggio o un'eliminazione l'elenco si aggiorna senza rileggere.
 */
export function useVoci() {
  const [stato, setStato] = useState<StatoVoci>({ fase: 'caricamento' })
  const [altreInCaricamento, setAltreInCaricamento] = useState(false)

  const ricarica = useCallback(async () => {
    setStato({ fase: 'caricamento' })
    try {
      const voci = await archivio.leggi({ limite: PAGINA })
      setStato({ fase: 'pronto', voci, finite: voci.length < PAGINA })
    } catch (e) {
      setStato({ fase: 'errore', messaggio: (e as Error).message })
    }
  }, [])

  useEffect(() => {
    void ricarica()
  }, [ricarica])

  const mostraAltre = async () => {
    if (stato.fase !== 'pronto' || stato.finite || altreInCaricamento) return
    setAltreInCaricamento(true)
    try {
      const altre = await archivio.leggi({ limite: PAGINA, prima: stato.voci.at(-1)?.quando })
      setStato((prima) =>
        prima.fase === 'pronto'
          ? { fase: 'pronto', voci: altre.reduce(conVoce, prima.voci), finite: altre.length < PAGINA }
          : prima,
      )
    } finally {
      setAltreInCaricamento(false)
    }
  }

  const salva = async (voce: Voce) => {
    await archivio.salva(voce)
    setStato((prima) => (prima.fase === 'pronto' ? { ...prima, voci: conVoce(prima.voci, voce) } : prima))
  }

  const elimina = async (id: string) => {
    await archivio.elimina(id)
    setStato((prima) => (prima.fase === 'pronto' ? { ...prima, voci: prima.voci.filter((v) => v.id !== id) } : prima))
  }

  return { stato, ricarica, mostraAltre, altreInCaricamento, salva, elimina }
}
