import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  titolo: string
  onChiudi: () => void
  children: ReactNode
  /** I pulsanti in fondo, fuori dalla parte che scorre. */
  piede?: ReactNode
  /**
   * Come compare sul telefono: al centro (le conferme), a tutto schermo (il
   * form) o come un foglio che sale dal basso (i dettagli). Da tablet in su è
   * sempre al centro.
   */
  mobile?: 'centrato' | 'schermoIntero' | 'foglio'
}

const SUL_TELEFONO = {
  centrato: '',
  schermoIntero: 'max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:rounded-none max-sm:border-0',
  foglio:
    'max-sm:mb-0 max-sm:max-h-[92dvh] max-sm:w-full max-sm:rounded-b-none max-sm:border-x-0 max-sm:border-b-0',
}

/**
 * Un modale su `<dialog>`, come in Grocery e Projects: il browser pensa a fuoco,
 * Esc e sfondo inerte. È aperto finché è montato; Esc, la X e il tocco fuori
 * chiamano `onChiudi`.
 */
export function Modale({ titolo, onChiudi, children, piede, mobile = 'centrato' }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const chiudi = useRef(onChiudi)

  useEffect(() => {
    chiudi.current = onChiudi
  })

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    d.showModal()
    // Esc: chiude chi possiede lo stato, non il browser da solo.
    const annulla = (evento: Event) => {
      evento.preventDefault()
      chiudi.current()
    }
    d.addEventListener('cancel', annulla)
    return () => {
      d.removeEventListener('cancel', annulla)
      d.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogo}
      aria-label={titolo}
      onClick={(evento) => {
        if (evento.target === dialogo.current) onChiudi()
      }}
      className={`open:animate-compari backdrop:animate-dissolvi m-auto max-h-[min(90dvh,800px)] w-[min(100%-24px,640px)] max-w-none overflow-hidden rounded-[14px] border border-bordo bg-white p-0 text-testo shadow-xl backdrop:bg-testo/40 ${SUL_TELEFONO[mobile]}`}
    >
      <div className={`flex max-h-[inherit] flex-col ${mobile === 'schermoIntero' ? 'max-sm:h-full' : ''}`}>
        <div
          className={`flex items-center gap-2 border-b border-bordo pr-1 pl-4 ${
            mobile === 'schermoIntero' ? 'max-sm:pt-[env(safe-area-inset-top)]' : ''
          }`}
        >
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{titolo}</h2>
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-[11px] text-testo-tenue hover:bg-fondo"
            aria-label="Chiudi"
            onClick={onChiudi}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {piede && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-bordo px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            {piede}
          </div>
        )}
      </div>
    </dialog>
  )
}
