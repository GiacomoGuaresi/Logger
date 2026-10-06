import { useState } from 'react'
import { Check, Pencil, Plus, X } from 'lucide-react'
import { confrontabile, filtra } from '../dominio/suggerimenti'
import { pulisci } from '../dominio/voce'

export interface Scelta {
  testo: string
  /** Un dettaglio in piccolo accanto al testo, come l'ultimo valore della chiave. */
  nota?: string | null
}

interface Props {
  etichetta: string
  /** Le scelte già usate, dalla più usata. Nessuna scelta inventata: solo quello che c'è. */
  scelte: readonly Scelta[]
  valore: string
  onScegli: (testo: string) => void
  /** Tocco sulla scelta fatta: si torna a scegliere. */
  onRiapri: () => void
  /** Come si chiama una scelta nuova: "Nuovo soggetto", "Nuova chiave". */
  nuovo: string
  maxLength: number
  /** Quante scelte si vedono prima di "Altre": le più usate. */
  quante?: number
}

const CHIP =
  'inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border px-3.5 text-[15px] select-none active:scale-[0.97] transition-transform'
const SPENTA = `${CHIP} border-bordo bg-white text-testo active:bg-fumo`
const ACCESA = `${CHIP} border-grafite bg-grafite font-semibold text-panna`

/**
 * Le scelte come pulsanti da toccare (docs/02-funzionalita.md#registra): dal
 * telefono basta un tocco, senza aprire la tastiera. "+" apre un campo che
 * filtra le scelte mentre si scrive e, se il testo non c'è, lo aggiunge.
 * Fatta la scelta, resta solo quella: toccandola si torna a scegliere.
 */
export function Scelte({ etichetta, scelte, valore, onScegli, onRiapri, nuovo, maxLength, quante = 10 }: Props) {
  const [cerca, setCerca] = useState<string | null>(null)
  const [tutte, setTutte] = useState(false)

  if (valore !== '') {
    const nota = scelte.find((s) => confrontabile(s.testo) === confrontabile(valore))?.nota
    return (
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-16 shrink-0 text-testo-tenue">{etichetta}</span>
        <button type="button" className={ACCESA} aria-label={`${etichetta}: ${valore}. Cambia`} onClick={onRiapri}>
          <Check className="size-4 shrink-0 text-ambra" aria-hidden="true" />
          <span className="truncate">{valore}</span>
          {nota && <span className="shrink-0 text-[13px] font-normal text-panna/75">{nota}</span>}
          <Pencil className="ml-1 size-3.5 shrink-0 text-panna/60" aria-hidden="true" />
        </button>
      </div>
    )
  }

  const testi = scelte.map((s) => s.testo)
  const scritto = pulisci(cerca ?? '')
  const esistente = scritto === '' ? undefined : testi.find((t) => confrontabile(t) === confrontabile(scritto))

  let visibili: Scelta[]
  if (cerca !== null) {
    const trovate = new Set(filtra(testi, cerca))
    visibili = scelte.filter((s) => trovate.has(s.testo))
  } else visibili = tutte ? [...scelte] : scelte.slice(0, quante)
  const nascoste = cerca === null && !tutte ? Math.max(0, scelte.length - quante) : 0
  // A database vuoto non c'è niente da toccare: si scrive subito.
  const campoAperto = cerca !== null || scelte.length === 0

  const scegli = (testo: string) => {
    onScegli(testo)
    setCerca(null)
  }

  const conferma = () => {
    if (scritto === '') return setCerca(null)
    scegli(esistente ?? scritto)
  }

  return (
    <fieldset className="animate-entra m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 font-semibold">{etichetta}</legend>
      {campoAperto && (
        <div className="flex gap-2">
          <input
            className="min-h-12 w-full min-w-0 rounded-[11px] border border-bordo bg-white px-3 text-testo outline-none placeholder:text-testo-tenue/70 focus:border-grafite focus:ring-2 focus:ring-ambra/40"
            value={cerca ?? ''}
            onChange={(e) => setCerca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                conferma()
              } else if (e.key === 'Escape') setCerca(null)
            }}
            placeholder={scelte.length === 0 ? `Scrivi ${etichetta.toLowerCase()}` : 'Cerca o aggiungi'}
            aria-label={`${etichetta}: cerca o aggiungi`}
            maxLength={maxLength}
            autoFocus={cerca !== null}
            autoComplete="off"
            autoCapitalize="sentences"
            spellCheck={false}
            enterKeyHint="done"
          />
          {scelte.length > 0 && (
            <button
              type="button"
              className="grid size-12 shrink-0 place-items-center rounded-[11px] border border-bordo bg-white text-testo-tenue active:bg-fumo"
              aria-label="Chiudi la ricerca"
              onClick={() => setCerca(null)}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {visibili.map((s) => (
          <button key={s.testo} type="button" className={SPENTA} onClick={() => scegli(s.testo)}>
            <span className="truncate">{s.testo}</span>
            {s.nota && <span className="shrink-0 text-[13px] text-testo-tenue">{s.nota}</span>}
          </button>
        ))}
        {cerca !== null && scritto !== '' && !esistente && (
          <button type="button" className={`${SPENTA} border-dashed`} onClick={conferma}>
            <Plus className="size-4 shrink-0 text-ambra-scura" aria-hidden="true" />
            <span className="truncate">
              {nuovo} <strong>«{scritto}»</strong>
            </span>
          </button>
        )}
        {nascoste > 0 && (
          <button type="button" className={`${SPENTA} text-testo-tenue`} onClick={() => setTutte(true)}>
            Altre {nascoste}
          </button>
        )}
        {!campoAperto && (
          <button
            type="button"
            className={`${SPENTA} border-dashed px-3 text-testo-tenue`}
            aria-label={`Cerca o aggiungi: ${etichetta}`}
            onClick={() => setCerca('')}
          >
            <Plus className="size-4" aria-hidden="true" />
            {nuovo.split(' ')[0]}
          </button>
        )}
      </div>
    </fieldset>
  )
}
