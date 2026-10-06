import { useEffect, useId, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { pulisci } from '../dominio/voce'
import { confrontabile, filtra } from '../dominio/suggerimenti'

interface Props {
  etichetta: string
  valore: string
  onCambia: (testo: string) => void
  /** Le scelte già usate, dalla più usata. Nessuna scelta inventata: solo quello che c'è. */
  scelte: readonly string[]
  segnaposto: string
  /** Come si chiama una scelta nuova: "Nuovo soggetto", "Nuova chiave". */
  nuovo: string
  maxLength: number
  /** Scelta fatta (o Invio a lista chiusa): chi usa il campo passa al prossimo. */
  onConferma: () => void
  inputRef?: Ref<HTMLInputElement>
}

type Opzione = { tipo: 'scelta'; testo: string } | { tipo: 'nuova'; testo: string }

const CAMPO =
  'min-h-12 w-full rounded-[11px] border border-bordo bg-white pr-11 pl-3 text-testo outline-none placeholder:text-testo-tenue/70 focus:border-grafite focus:ring-2 focus:ring-ambra/40'

/**
 * Una select con ricerca (combobox): toccandola si apre l'elenco delle scelte
 * già usate, scrivendo lo si filtra senza badare a maiuscole e accenti. Se il
 * testo non c'è tra le scelte, in fondo compare "Nuovo … «testo»": così un
 * soggetto o una chiave nuovi nascono la prima volta che si scrivono
 * (docs/02-funzionalita.md#registra).
 *
 * Tastiera: frecce per muoversi, Invio per scegliere, Esc per chiudere.
 */
export function CampoScelta({ etichetta, valore, onCambia, scelte, segnaposto, nuovo, maxLength, onConferma, inputRef }: Props) {
  const id = useId()
  const [aperta, setAperta] = useState(false)
  /** Il testo con cui si filtra: `null` appena aperta, così si vedono tutte le scelte. */
  const [cercato, setCercato] = useState<string | null>(null)
  const [evidenziata, setEvidenziata] = useState(0)
  const elenco = useRef<HTMLUListElement>(null)

  const trovate = filtra(scelte, cercato ?? '')
  const testo = pulisci(cercato ?? '')
  const giaCe = scelte.some((s) => confrontabile(s) === confrontabile(testo))
  const opzioni: Opzione[] = [
    ...trovate.map((t): Opzione => ({ tipo: 'scelta', testo: t })),
    ...(testo !== '' && !giaCe ? [{ tipo: 'nuova', testo } as const] : []),
  ]
  const mostra = aperta && opzioni.length > 0

  useEffect(() => {
    if (!mostra) return
    elenco.current?.querySelector(`[data-indice="${evidenziata}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [mostra, evidenziata])

  const apri = () => {
    setCercato(null)
    setEvidenziata(0)
    setAperta(true)
  }

  const scegli = (opzione: Opzione) => {
    onCambia(opzione.testo)
    setAperta(false)
    setCercato(null)
    onConferma()
  }

  const tasto = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (!mostra) return apri()
      const passo = evento.key === 'ArrowDown' ? 1 : -1
      setEvidenziata((i) => (i + passo + opzioni.length) % opzioni.length)
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      if (mostra && opzioni[evidenziata]) scegli(opzioni[evidenziata])
      else {
        setAperta(false)
        onConferma()
      }
    } else if (evento.key === 'Escape' && mostra) {
      evento.preventDefault()
      setAperta(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {etichetta}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          className={CAMPO}
          value={valore}
          placeholder={segnaposto}
          maxLength={maxLength}
          role="combobox"
          aria-expanded={mostra}
          aria-controls={`${id}-elenco`}
          aria-autocomplete="list"
          aria-activedescendant={mostra ? `${id}-${evidenziata}` : undefined}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="next"
          onFocus={(e) => {
            // Tutto selezionato: si vede l'elenco intero, e scrivendo si sostituisce.
            e.currentTarget.select()
            apri()
          }}
          onClick={(e) => {
            // Riaperta col fuoco già qui: di nuovo tutto selezionato, così scrivendo si sostituisce.
            if (!aperta) {
              e.currentTarget.select()
              apri()
            }
          }}
          onBlur={() => setAperta(false)}
          onChange={(e) => {
            onCambia(e.target.value)
            setCercato(e.target.value)
            setEvidenziata(0)
            setAperta(true)
          }}
          onKeyDown={tasto}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={mostra ? `Chiudi l'elenco: ${etichetta}` : `Apri l'elenco: ${etichetta}`}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-testo-tenue"
          // Il fuoco resta sul campo: niente blur che chiuderebbe l'elenco.
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            const campo = e.currentTarget.previousElementSibling as HTMLInputElement | null
            if (mostra) setAperta(false)
            else if (campo && document.activeElement === campo) {
              campo.select()
              apri()
            } else campo?.focus()
          }}
        >
          <ChevronDown className={`size-5 transition-transform ${mostra ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {mostra && (
          <ul
            id={`${id}-elenco`}
            ref={elenco}
            role="listbox"
            aria-label={etichetta}
            className="animate-compari absolute inset-x-0 top-full z-20 m-0 mt-1 max-h-64 list-none overflow-y-auto rounded-[11px] border border-bordo bg-white p-1 shadow-lg"
          >
            {opzioni.map((opzione, i) => {
              const scelta = opzione.tipo === 'scelta' && confrontabile(opzione.testo) === confrontabile(valore)
              return (
                <li
                  key={`${opzione.tipo}-${opzione.testo}`}
                  id={`${id}-${i}`}
                  data-indice={i}
                  role="option"
                  aria-selected={i === evidenziata}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setEvidenziata(i)}
                  onClick={() => scegli(opzione)}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 aria-selected:bg-fumo"
                >
                  {opzione.tipo === 'nuova' ? (
                    <>
                      <Plus className="size-4 shrink-0 text-ambra-scura" aria-hidden="true" />
                      <span className="min-w-0 truncate">
                        {nuovo} <strong>«{opzione.testo}»</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={`min-w-0 flex-1 truncate ${scelta ? 'font-semibold' : ''}`}>{opzione.testo}</span>
                      {scelta && <Check className="size-4 shrink-0 text-ambra-scura" aria-hidden="true" />}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
