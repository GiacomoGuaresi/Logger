import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { LIMITI, nuovaVoce, type Voce } from '../dominio/voce'
import { CampoQuando } from './CampoQuando'
import { Modale } from './Modale'

interface Props {
  voce: Voce
  /** La riga corretta, con lo stesso id. */
  onSalva: (voce: Voce) => void
  onElimina: (voce: Voce) => void
  onChiudi: () => void
}

const CAMPO =
  'min-h-12 w-full rounded-[11px] border border-bordo bg-white px-3 text-testo outline-none placeholder:text-testo-tenue/70 focus:border-grafite focus:ring-2 focus:ring-ambra/40'

/**
 * Una riga del diario da correggere (docs/02-funzionalita.md#diario): chiave,
 * valore e data. Il soggetto resta, così la riga non cambia diario; da qui si
 * elimina anche, e l'eliminazione si può annullare.
 */
export function ModificaVoce({ voce, onSalva, onElimina, onChiudi }: Props) {
  const [chiave, setChiave] = useState(voce.chiave)
  const [valore, setValore] = useState(voce.valore ?? '')
  const [quando, setQuando] = useState(new Date(voce.quando))
  const [errore, setErrore] = useState<string | null>(null)

  const salva = (evento?: FormEvent) => {
    evento?.preventDefault()
    const esito = nuovaVoce({ soggetto: voce.soggetto, chiave, valore }, quando, voce.id)
    if (!esito.ok) return setErrore(esito.errore)
    onSalva(esito.voce)
  }

  return (
    <Modale
      titolo={`Modifica · ${voce.soggetto}`}
      onChiudi={onChiudi}
      mobile="foglio"
      piede={
        <>
          <button
            type="button"
            className="mr-auto inline-flex min-h-11 items-center gap-1.5 rounded-[11px] px-3 font-semibold text-pericolo hover:bg-pericolo/10"
            onClick={() => onElimina(voce)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Elimina
          </button>
          <button type="button" className="min-h-11 rounded-[11px] px-4 font-semibold text-testo-tenue hover:bg-fondo" onClick={onChiudi}>
            Annulla
          </button>
          <button
            type="button"
            className="min-h-11 rounded-[11px] bg-grafite px-5 font-semibold text-panna hover:bg-grafite-scura"
            onClick={() => salva()}
          >
            Salva
          </button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={salva} noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Chiave</span>
          <input
            className={CAMPO}
            value={chiave}
            onChange={(e) => setChiave(e.target.value)}
            maxLength={LIMITI.chiave}
            autoComplete="off"
            enterKeyHint="done"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span>
            <span className="font-semibold">Valore</span> <span className="text-testo-tenue">· facoltativo</span>
          </span>
          <input
            className={CAMPO}
            value={valore}
            onChange={(e) => setValore(e.target.value)}
            maxLength={LIMITI.valore}
            autoComplete="off"
            enterKeyHint="done"
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold">Quando</span>
          <CampoQuando valore={quando} onCambia={(data) => data && setQuando(data)} conAdesso={false} />
        </div>
        {errore && (
          <p className="m-0 text-sm text-pericolo" role="alert">
            {errore}
          </p>
        )}
        {/* Invio da tastiera salva anche senza pulsante dentro il form. */}
        <button type="submit" hidden />
      </form>
    </Modale>
  )
}
