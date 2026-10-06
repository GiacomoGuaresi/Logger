import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, CloudUpload } from 'lucide-react'
import { chiaviUsate, soggettiUsati, ultimoValore, type Uso } from '../dominio/suggerimenti'
import { LIMITI, nuovaVoce, type Voce } from '../dominio/voce'
import { CampoScelta } from './CampoScelta'
import { leggiUltimoSoggetto, salvaUltimoSoggetto } from './preferenze'

interface Props {
  /** Il riepilogo di tutte le righe: da qui vengono le scelte e l'ultimo valore. */
  usi: readonly Uso[]
  /** Le righe non ancora arrivate al Mac: la conferma dice "da inviare" finché non partono. */
  inAttesa: ReadonlySet<string>
  /** Va subito a schermo e in coda; se manca la rete parte dopo, da sola. */
  onSalva: (voce: Voce) => void
}

const CAMPO =
  'min-h-12 w-full rounded-[11px] border border-bordo bg-white px-3 text-testo outline-none placeholder:text-testo-tenue/70 focus:border-grafite focus:ring-2 focus:ring-ambra/40'

/**
 * La schermata principale (docs/02-funzionalita.md#registra): soggetto e chiave
 * sono select con ricerca tra quelli già usati, il valore è libero e suggerisce
 * l'ultimo scritto per quella chiave. Il soggetto resta e si ricorda; chiave e
 * valore si svuotano dopo ogni riga, e il fuoco torna sulla chiave per la prossima.
 */
export function Registra({ usi, inAttesa, onSalva }: Props) {
  const [soggetto, setSoggetto] = useState(leggiUltimoSoggetto)
  const [chiave, setChiave] = useState('')
  const [valore, setValore] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  /** La conferma breve dopo il salvataggio: cambia a ogni riga, così si riavvia. */
  const [salvata, setSalvata] = useState<Voce | null>(null)
  const campoChiave = useRef<HTMLInputElement>(null)
  const campoValore = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!salvata) return
    const via = setTimeout(() => setSalvata(null), 2500)
    return () => clearTimeout(via)
  }, [salvata])

  const ultimo = ultimoValore(usi, soggetto, chiave)

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
      <CampoScelta
        etichetta="Soggetto"
        valore={soggetto}
        onCambia={setSoggetto}
        scelte={soggettiUsati(usi)}
        segnaposto="Cerca o aggiungi un soggetto"
        nuovo="Nuovo soggetto"
        maxLength={LIMITI.soggetto}
        onConferma={() => campoChiave.current?.focus()}
      />
      <CampoScelta
        inputRef={campoChiave}
        etichetta="Chiave"
        valore={chiave}
        onCambia={setChiave}
        scelte={chiaviUsate(usi, soggetto)}
        segnaposto="Cerca o aggiungi una chiave"
        nuovo="Nuova chiave"
        maxLength={LIMITI.chiave}
        onConferma={() => campoValore.current?.focus()}
      />
      <label className="flex flex-col gap-1.5">
        <span>
          <span className="font-semibold">Valore</span> <span className="text-testo-tenue">· facoltativo</span>
        </span>
        <input
          ref={campoValore}
          className={CAMPO}
          value={valore}
          onChange={(e) => setValore(e.target.value)}
          // L'ultimo valore scritto per questa chiave, come riferimento: non si salva da solo.
          placeholder={ultimo ?? ''}
          aria-description={ultimo ? `Ultimo valore: ${ultimo}` : undefined}
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
        className="min-h-12 rounded-[11px] bg-grafite px-4 text-base font-semibold text-panna hover:bg-grafite-scura active:bg-grafite-scura"
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
