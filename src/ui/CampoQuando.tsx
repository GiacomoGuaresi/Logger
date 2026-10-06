import { CalendarClock, X } from 'lucide-react'
import { daCampo, etichetta, ilGiornoPrima, perCampo } from '../dominio/quando'

interface Props {
  /** La data scelta; `null` è "adesso", cioè il momento in cui si salva. */
  valore: Date | null
  onCambia: (data: Date | null) => void
  /** Senza, non si torna ad "adesso" (nella modifica la riga ha già la sua data). */
  conAdesso?: boolean
}

const PILLOLA = 'relative inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm active:bg-fumo'

/**
 * Quando è successo (docs/02-funzionalita.md#registra): "Adesso" finché non si
 * cambia, poi la data scelta in ambra, così si vede che non è quella di oggi.
 * "Cambia" è il `datetime-local` nativo, trasparente sopra il pulsante: un
 * tocco apre il selettore di sistema del telefono, senza tastiera.
 */
export function CampoQuando({ valore, onCambia, conAdesso = true }: Props) {
  const adesso = new Date()
  const scelta = valore !== null

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-2">
      <span className={`mr-auto inline-flex items-center gap-1.5 ${scelta && conAdesso ? 'font-semibold text-ambra-scura' : ''}`}>
        <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
        {scelta ? etichetta(valore, adesso) : 'Adesso'}
      </span>
      {conAdesso && !scelta && (
        <button type="button" className={`${PILLOLA} border-bordo bg-white`} onClick={() => onCambia(ilGiornoPrima(adesso))}>
          Ieri
        </button>
      )}
      <span className={`${PILLOLA} border-bordo bg-white`}>
        Cambia
        <input
          type="datetime-local"
          aria-label="Cambia data e ora"
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          value={perCampo(valore ?? adesso)}
          max={perCampo(adesso)}
          onChange={(e) => {
            const data = daCampo(e.target.value)
            if (data) onCambia(data)
          }}
        />
      </span>
      {conAdesso && scelta && (
        <button type="button" className={`${PILLOLA} border-bordo bg-white`} aria-label="Torna ad adesso" onClick={() => onCambia(null)}>
          Adesso
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
