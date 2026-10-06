import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { LIMITI, nuovaVoce, type Voce } from '../dominio/voce'
import { leggiUltimoSoggetto, salvaUltimoSoggetto } from './preferenze'

interface Props {
  /** Salva la riga; se va male lancia un errore con un messaggio da mostrare. */
  onSalva: (voce: Voce) => Promise<void>
}

const CAMPO =
  'min-h-12 w-full rounded-[11px] border border-bordo bg-white px-3 text-testo outline-none placeholder:text-testo-tenue/70 focus:border-grafite focus:ring-2 focus:ring-ambra/40'

/**
 * La schermata principale (docs/02-funzionalita.md#registra): soggetto, chiave,
 * valore facoltativo e Salva. Il soggetto resta e si ricorda; chiave e valore
 * si svuotano dopo ogni riga, e il fuoco torna sulla chiave per la prossima.
 */
export function Registra({ onSalva }: Props) {
  const [soggetto, setSoggetto] = useState(leggiUltimoSoggetto)
  const [chiave, setChiave] = useState('')
  const [valore, setValore] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  /** La conferma breve dopo il salvataggio: cambia a ogni riga, così si riavvia. */
  const [salvata, setSalvata] = useState<Voce | null>(null)
  const campoChiave = useRef<HTMLInputElement>(null)
  const campoSoggetto = useRef<HTMLInputElement>(null)

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

  const salva = async (evento: FormEvent) => {
    evento.preventDefault()
    if (salvando) return
    setErrore(null)
    const esito = nuovaVoce({ soggetto, chiave, valore })
    if (!esito.ok) {
      setErrore(esito.errore)
      return
    }
    setSalvando(true)
    try {
      await onSalva(esito.voce)
      salvaUltimoSoggetto(esito.voce.soggetto)
      setSoggetto(esito.voce.soggetto)
      setChiave('')
      setValore('')
      setSalvata(esito.voce)
      campoChiave.current?.focus()
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="animate-entra flex flex-col gap-4 pt-2" onSubmit={(e) => void salva(e)} noValidate>
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
      <label className="flex flex-col gap-1.5">
        <span>
          <span className="font-semibold">Valore</span> <span className="text-testo-tenue">· facoltativo</span>
        </span>
        <input
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
        disabled={salvando}
        className="min-h-12 rounded-[11px] bg-grafite px-4 text-base font-semibold text-panna hover:bg-grafite-scura active:bg-grafite-scura disabled:opacity-60"
      >
        {salvando ? 'Salvo…' : 'Salva'}
      </button>
      <p className="m-0 min-h-5 text-center text-sm" role="status">
        {salvata && (
          <span key={salvata.id} className="animate-entra inline-flex items-center gap-1.5 font-semibold text-ambra-scura">
            <Check className="size-4" aria-hidden="true" />
            Salvato: {salvata.soggetto} · {salvata.chiave}
            {salvata.valore !== null && ` · ${salvata.valore}`}
          </span>
        )}
      </p>
    </form>
  )
}
