import { useEffect, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { Check, CloudUpload, RotateCcw } from 'lucide-react'
import { conUnita, eNumero, unitaDi } from '../dominio/numero'
import { chiaviUsate, confrontabile, soggettiUsati, ultimoValore, type Uso } from '../dominio/suggerimenti'
import { LIMITI, nuovaVoce, type Voce } from '../dominio/voce'
import { CampoQuando } from './CampoQuando'
import { Scelte } from './Scelte'

interface Props {
  /** Il soggetto già scelto, dal "+ Riga" del diario; vuoto si parte dal soggetto. */
  soggettoIniziale: string
  /** Il riepilogo di tutte le righe: da qui vengono le scelte e l'ultimo valore. */
  usi: readonly Uso[]
  /** Le righe non ancora arrivate all'archivio: la conferma dice "da inviare" finché non partono. */
  inAttesa: ReadonlySet<string>
  /** Va subito a schermo e in coda; se manca la rete parte dopo, da sola. */
  onSalva: (voce: Voce) => void
}

/**
 * La schermata principale (docs/02-funzionalita.md#registra), pensata per il
 * pollice e fatta a passi: prima il soggetto, poi compare la chiave, poi il
 * valore con Salva. Soggetto e chiave si toccano, la tastiera si apre solo per
 * il valore, ed è quella numerica se l'ultimo valore era un numero. La data è
 * adesso, ma si può cambiare per registrare qualcosa a posteriori. Dopo ogni
 * riga il soggetto resta e si riparte dalla chiave.
 */
export function Registra({ soggettoIniziale, usi, inAttesa, onSalva }: Props) {
  const [soggetto, setSoggetto] = useState(soggettoIniziale)
  const [chiave, setChiave] = useState('')
  const [valore, setValore] = useState('')
  /** Quando è successo: `null` è adesso, il momento in cui si salva. */
  const [quando, setQuando] = useState<Date | null>(null)
  /** Tastiera di testo anche dove l'ultimo valore era un numero, per scrivere "pieno". */
  const [aTesto, setATesto] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  /** La conferma breve dopo il salvataggio: cambia a ogni riga, così si riavvia. */
  const [salvata, setSalvata] = useState<Voce | null>(null)
  const campoValore = useRef<HTMLInputElement>(null)
  const pulsanteSalva = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!salvata) return
    const via = setTimeout(() => setSalvata(null), 2500)
    return () => clearTimeout(via)
  }, [salvata])

  const ultimo = ultimoValore(usi, soggetto, chiave)
  const unita = unitaDi(ultimo)
  const numerico = unita !== null && !aTesto
  /** L'unità si vede dentro il campo finché quello che si scrive è un numero. */
  const mostraUnita = numerico && unita !== '' && (valore === '' || eNumero(valore))
  /** L'ultimo valore senza unità: quello che si scriverebbe nel campo. */
  const ultimoNudo = ultimo && numerico && unita ? ultimo.slice(0, -unita.length) : ultimo
  const daSalvare = numerico ? conUnita(valore, unita) : valore

  const soggetti = soggettiUsati(usi).map((testo) => ({ testo }))
  const chiavi = chiaviUsate(usi, soggetto).map((testo) => ({ testo, nota: ultimoValore(usi, soggetto, testo) }))

  const scegliSoggetto = (testo: string) => {
    setSoggetto(testo)
    setErrore(null)
  }

  const riapriSoggetto = () => {
    setSoggetto('')
    setChiave('')
    setValore('')
    setErrore(null)
  }

  const scegliChiave = (testo: string) => {
    // Subito a schermo, così il campo ha già la tastiera giusta quando prende il fuoco.
    flushSync(() => {
      setChiave(testo)
      setATesto(false)
      setErrore(null)
    })
    const giaUsata = chiavi.some((c) => confrontabile(c.testo) === confrontabile(testo))
    // Una chiave che non ha mai avuto un valore ("Controllo olio") si salva e basta: niente tastiera.
    if (giaUsata && !ultimoValore(usi, soggetto, testo)) pulsanteSalva.current?.scrollIntoView({ block: 'nearest' })
    else campoValore.current?.focus()
  }

  const cambiaTastiera = () => {
    flushSync(() => setATesto((t) => !t))
    // Il telefono cambia tastiera solo se il campo riprende il fuoco.
    campoValore.current?.blur()
    campoValore.current?.focus()
  }

  const salva = (evento: FormEvent) => {
    evento.preventDefault()
    setErrore(null)
    const esito = nuovaVoce({ soggetto, chiave, valore: daSalvare }, quando ?? new Date())
    if (!esito.ok) {
      setErrore(esito.errore)
      return
    }
    onSalva(esito.voce)
    setSoggetto(esito.voce.soggetto)
    setChiave('')
    setValore('')
    setATesto(false)
    setQuando(null)
    setSalvata(esito.voce)
    // Via la tastiera: la prossima riga si comincia toccando una chiave.
    campoValore.current?.blur()
  }

  return (
    <form className="animate-entra flex flex-col gap-4 pt-2" onSubmit={salva} noValidate>
      <Scelte
        etichetta="Soggetto"
        scelte={soggetti}
        valore={soggetto}
        onScegli={scegliSoggetto}
        onRiapri={riapriSoggetto}
        nuovo="Nuovo soggetto"
        maxLength={LIMITI.soggetto}
        quante={6}
      />
      {soggetto !== '' && (
        <Scelte
          etichetta="Chiave"
          scelte={chiavi}
          valore={chiave}
          onScegli={scegliChiave}
          onRiapri={() => setChiave('')}
          nuovo="Nuova chiave"
          maxLength={LIMITI.chiave}
          quante={12}
        />
      )}
      {chiave !== '' && (
        <div className="animate-entra flex flex-col gap-2">
          <CampoQuando valore={quando} onCambia={setQuando} />
          <div className="flex min-h-9 items-center gap-2">
            <label htmlFor="valore" className="mr-auto">
              <span className="font-semibold">Valore</span> <span className="text-testo-tenue">· facoltativo</span>
            </label>
            {unita !== null && (
              <button
                type="button"
                className="min-h-9 rounded-full px-3 text-sm font-semibold text-testo-tenue active:bg-fumo"
                aria-label={aTesto ? 'Tastiera numerica' : 'Tastiera con le lettere'}
                onMouseDown={(e) => e.preventDefault()}
                onClick={cambiaTastiera}
              >
                {aTesto ? '123' : 'abc'}
              </button>
            )}
            {ultimo && daSalvare !== ultimo && (
              <button
                type="button"
                className="inline-flex min-h-9 max-w-[60%] items-center gap-1.5 rounded-full border border-bordo bg-white px-3 text-sm active:bg-fumo"
                aria-label={`Ripeti l'ultimo valore: ${ultimo}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setValore(ultimoNudo ?? '')
                  pulsanteSalva.current?.scrollIntoView({ block: 'nearest' })
                }}
              >
                <RotateCcw className="size-3.5 shrink-0 text-testo-tenue" aria-hidden="true" />
                <span className="truncate">{ultimo}</span>
              </button>
            )}
          </div>
          {/* Salva accanto al campo: resta visibile anche con la tastiera aperta, che sul tastierino numerico non ha Invio. */}
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                id="valore"
                ref={campoValore}
                className={`min-h-12 w-full rounded-[11px] border border-bordo bg-white pl-3 text-testo outline-none placeholder:text-testo-tenue/70 focus:border-grafite focus:ring-2 focus:ring-ambra/40 ${mostraUnita ? 'pr-12' : 'pr-3'}`}
                value={valore}
                onChange={(e) => setValore(e.target.value)}
                // L'ultimo valore come riferimento, senza l'unità che si vede già: non si salva da solo.
                placeholder={(mostraUnita ? ultimoNudo : ultimo) ?? ''}
                aria-description={ultimo ? `Ultimo valore: ${ultimo}` : undefined}
                maxLength={LIMITI.valore}
                inputMode={numerico ? 'decimal' : 'text'}
                autoComplete="off"
                autoCapitalize="none"
                enterKeyHint="send"
              />
              {mostraUnita && (
                <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-testo-tenue" aria-hidden="true">
                  {unita.trim()}
                </span>
              )}
            </div>
            <button
              ref={pulsanteSalva}
              type="submit"
              className="min-h-12 shrink-0 rounded-[11px] bg-grafite px-6 text-base font-semibold text-panna hover:bg-grafite-scura active:bg-grafite-scura"
            >
              Salva
            </button>
          </div>
        </div>
      )}
      {errore && (
        <p className="m-0 text-sm text-pericolo" role="alert">
          {errore}
        </p>
      )}
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
