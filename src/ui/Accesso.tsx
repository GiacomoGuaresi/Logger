import { useState, type FormEvent } from 'react'
import { NotebookPen } from 'lucide-react'
import type { EsitoAccesso } from '../dati'

const avvisi: Record<Exclude<EsitoAccesso, 'dentro'>, string> = {
  'passphrase-sbagliata': 'Passphrase sbagliata.',
  errore: 'Non riesco a entrare: controlla la connessione e riprova.',
}

interface Props {
  onEntra: (passphrase: string) => Promise<EsitoAccesso>
}

/**
 * La schermata d'accesso (docs/09-interfaccia.md): come nelle altre app, il solo
 * campo passphrase. Si vede una volta per dispositivo, poi la sessione resta
 * nei cookie, condivisa con Grocery, Projects e Adventures.
 */
export function Accesso({ onEntra }: Props) {
  const [passphrase, setPassphrase] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [avviso, setAvviso] = useState<string | null>(null)

  const invia = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!passphrase || inCorso) return
    setInCorso(true)
    setAvviso(null)
    const esito = await onEntra(passphrase)
    // Se si è entrati questa schermata sparisce: non c'è altro da fare.
    if (esito === 'dentro') return
    setAvviso(avvisi[esito])
    setInCorso(false)
  }

  return (
    <main className="sfondo-diario grid min-h-dvh place-items-center p-3">
      <form className="flex w-full max-w-[300px] flex-col gap-2" onSubmit={invia}>
        <NotebookPen className="size-11 self-center text-ambra" aria-hidden="true" />
        <h1 className="mb-3 text-center text-lg font-semibold">Logger</h1>
        <label className="text-sm text-testo-tenue" htmlFor="passphrase">
          Passphrase
        </label>
        <input
          id="passphrase"
          className="min-h-12 rounded-[11px] border border-bordo bg-white px-3 outline-none focus:border-grafite focus:ring-2 focus:ring-ambra/40"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={passphrase}
          onChange={(evento) => {
            setPassphrase(evento.target.value)
            setAvviso(null)
          }}
        />
        {avviso && (
          <p className="m-0 text-sm text-pericolo" role="alert">
            {avviso}
          </p>
        )}
        <button
          className="min-h-12 rounded-[11px] bg-grafite font-semibold text-panna hover:bg-grafite-scura disabled:opacity-50"
          type="submit"
          disabled={!passphrase || inCorso}
        >
          {inCorso ? 'Entro…' : 'Entra'}
        </button>
      </form>
    </main>
  )
}

/** Quando non si riesce nemmeno a chiedere la passphrase (configurazione mancante). */
export function AccessoImpossibile() {
  return (
    <main className="sfondo-diario grid min-h-dvh place-items-center p-3">
      <p className="m-0 text-center text-testo-tenue" role="alert">
        Non riesco a collegarmi al database condiviso.
      </p>
    </main>
  )
}
