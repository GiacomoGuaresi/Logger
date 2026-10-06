import { useEffect, useRef } from 'react'

interface Props {
  testo: string
  /** L'etichetta del pulsante, come "Annulla". */
  azione: string
  onAzione: () => void
  /** Scaduto il tempo, l'avviso sparisce da solo. */
  onScade: () => void
  durataMs?: number
}

/**
 * Un avviso breve in basso, sopra la safe area, con un'azione: "Eliminata ·
 * Annulla". Al posto delle conferme: si fa subito, e si torna indietro se serve.
 */
export function Avviso({ testo, azione, onAzione, onScade, durataMs = 5000 }: Props) {
  const scade = useRef(onScade)

  useEffect(() => {
    scade.current = onScade
  })

  useEffect(() => {
    const via = setTimeout(() => scade.current(), durataMs)
    return () => clearTimeout(via)
  }, [testo, durataMs])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
      <div
        role="status"
        className="animate-entra pointer-events-auto flex min-h-12 w-full max-w-[480px] items-center gap-3 rounded-[14px] bg-grafite py-1 pr-1 pl-4 text-panna shadow-lg"
      >
        <span className="min-w-0 flex-1 truncate">{testo}</span>
        <button type="button" className="min-h-10 shrink-0 rounded-[11px] px-3 font-semibold text-ambra active:bg-grafite-scura" onClick={onAzione}>
          {azione}
        </button>
      </div>
    </div>
  )
}
