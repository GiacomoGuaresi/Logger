import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, CloudUpload } from 'lucide-react'
import { chiaviUsate, confrontabile, soggettiUsati } from '../dominio/suggerimenti'
import { LIMITI, nuovaVoce, type Voce } from '../dominio/voce'
import { leggiUltimoSoggetto, salvaUltimoSoggetto } from './preferenze'

interface Props {
  /** Le righe già lette: da qui vengono i suggerimenti. */
  voci: readonly Voce[]
  /** Le righe non ancora arrivate al Mac: la conferma dice "da inviare" finché non partono. */
  inAttesa: ReadonlySet<string>
  /** Va subito a schermo e in coda; se manca la rete parte dopo, da sola. */
  onSalva: (voce: Voce) => void
}

/**
 * I suggerimenti come pulsanti sotto un campo: un tocco scrive il testo nel
 * campo. Quello uguale al testo già scritto è segnato.
 */
function Suggerimenti({ etichetta, testi, attuale, onScegli }: {
  etichetta: string
  testi: readonly string[]
  attuale: string
  onScegli: (testo: string) => void
}) {
  if (testi.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={etichetta}>
      {testi.map((testo) => (
        <button
          key={testo}
          type="button"
          aria-pressed={confrontabile(testo) === confrontabile(attuale)}
          onClick={() => onScegli(testo)}
          className="min-h-9 max-w-full truncate rounded-full border border-bordo bg-white px-3 text-sm hover:border-grafite active:bg-fumo aria-pressed:border-grafite aria-pressed:bg-grafite aria-pressed:text-panna"
        >
          {testo}
        </button>
      ))}
    </div>
  )
}

const CAMPO =
  'min-h-12 w-full rounded-[11px] border border-bordo bg-white px-3 text-testo outline-none placeholder:text-testo-tenue/70 focus:border-grafite focus:ring-2 focus:ring-ambra/40'

/**
 * La schermata principale (docs/02-funzionalita.md#registra): soggetto, chiave,
 * valore facoltativo e Salva. Il soggetto resta e si ricorda; chiave e valore
 * si svuotano dopo ogni riga, e il fuoco torna sulla chiave per la prossima.
 */
export function Registra({ voci, inAttesa, onSalva }: Props) {
  const [soggetto, setSoggetto] = useState(leggiUltimoSoggetto)
  const [chiave, setChiave] = useState('')
  const [valore, setValore] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  /** La conferma breve dopo il salvataggio: cambia a ogni riga, così si riavvia. */
  const [salvata, setSalvata] = useState<Voce | null>(null)
  const campoChiave = useRef<HTMLInputElement>(null)
  const campoSoggetto = useRef<HTMLInputElement>(null)
  const campoValore = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Col soggetto già scelto si parte dalla chiave.
    ;(soggetto ? campoChiave : campoSoggetto).current?.focus()
    // Solo all'apertura.
  }, [])

  useEffect(() => {
    if (!salvata) return
    const via = setTimeout(() => setSalvata(null), 2500)
    return () => clearTimeout(via)
  }, [salvata])

  const salva = (evento: FormEvent) => {
    evento.preventDefault()
    setErrore(null)
    const esito = nuovaVoce({ soggetto, chiave, valore })
    if (!esito.ok) {
      setErrore(esito.errore)
      return
    }
    onSalva(esito.voce)
    salvaUltimoSoggetto(esito.voce.soggetto)
    setSoggetto(esito.voce.soggetto)
    setChiave('')
    setValore('')
    setSalvata(esito.voce)
    campoChiave.current?.focus()
  }

  return (
    <form className="animate-entra flex flex-col gap-4 pt-2" onSubmit={salva} noValidate>
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Soggetto</span>
          <input
            ref={campoSoggetto}
            className={CAMPO}
            value={soggetto}
            onChange={(e) => setSoggetto(e.target.value)}
            placeholder="moto, auto…"
            maxLength={LIMITI.soggetto}
            autoCapitalize="none"
            autoComplete="off"
            enterKeyHint="next"
          />
        </label>
        <Suggerimenti
          etichetta="Soggetti già usati"
          testi={soggettiUsati(voci)}
          attuale={soggetto}
          onScegli={(testo) => {
            setSoggetto(testo)
            campoChiave.current?.focus()
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Chiave</span>
          <input
            ref={campoChiave}
            className={CAMPO}
            value={chiave}
            onChange={(e) => setChiave(e.target.value)}
            placeholder="km, Benzina, Controllo olio…"
            maxLength={LIMITI.chiave}
            autoComplete="off"
            enterKeyHint="next"
          />
        </label>
        <Suggerimenti
          etichetta="Chiavi già usate"
          testi={chiaviUsate(voci, soggetto)}
          attuale={chiave}
          onScegli={(testo) => {
            setChiave(testo)
            campoValore.current?.focus()
          }}
        />
      </div>
      <label className="flex flex-col gap-1.5">
        <span>
          <span className="font-semibold">Valore</span> <span className="text-testo-tenue">· facoltativo</span>
        </span>
        <input
          ref={campoValore}
          className={CAMPO}
          value={valore}
          onChange={(e) => setValore(e.target.value)}
          placeholder="41000, 25€… o vuoto se è solo fatto"
          maxLength={LIMITI.valore}
          autoComplete="off"
          enterKeyHint="done"
        />
      </label>
      {errore && (
        <p className="m-0 text-sm text-pericolo" role="alert">
          {errore}
        </p>
      )}
      <button
        type="submit"
        className="min-h-12 rounded-[11px] bg-grafite px-4 text-base font-semibold text-panna hover:bg-grafite-scura active:bg-grafite-scura "
      >
        Salva
      </button>
      <p className="m-0 min-h-5 text-center text-sm" role="status">
        {salvata && (
          <span key={salvata.id} className="animate-entra inline-flex items-center gap-1.5 font-semibold text-ambra-scura">
            {inAttesa.has(salvata.id) ? (
              <CloudUpload className="size-4" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            {inAttesa.has(salvata.id) ? 'Salvato, da inviare' : 'Salvato'}: {salvata.soggetto} · {salvata.chiave}
            {salvata.valore !== null && ` · ${salvata.valore}`}
          </span>
        )}
      </p>
    </form>
  )
}
