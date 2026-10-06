import { useState } from 'react'
import { CloudUpload, PenLine, Trash2 } from 'lucide-react'
import { ora, perGiorno } from '../dominio/diario'
import type { Voce } from '../dominio/voce'
import { Conferma } from './Conferma'
import { indirizzi } from './rotta'

interface Props {
  voci: readonly Voce[]
  finite: boolean
  /** Le righe con una scrittura non ancora arrivata al Mac: hanno il segno "da inviare". */
  inAttesa: ReadonlySet<string>
  onMostraAltre: () => Promise<void>
  /** Va subito a schermo; se manca la rete parte dopo, da sola. */
  onElimina: (id: string) => void
}

function descrivi(voce: Voce): string {
  return `${voce.soggetto} · ${voce.chiave}${voce.valore === null ? '' : ` · ${voce.valore}`}`
}

/**
 * Tutte le righe dalla più recente, raggruppate per giorno
 * (docs/02-funzionalita.md#diario). Il cestino, dietro una conferma, serve per
 * gli errori di battitura. Anche senza rete: l'eliminazione parte quando torna.
 */
export function Diario({ voci, finite, inAttesa, onMostraAltre, onElimina }: Props) {
  const [daEliminare, setDaEliminare] = useState<Voce | null>(null)
  const [altreInCaricamento, setAltreInCaricamento] = useState(false)
  const [erroreAltre, setErroreAltre] = useState<string | null>(null)

  if (voci.length === 0) {
    return (
      <div className="animate-entra mt-10 flex flex-col items-center gap-3 text-center text-testo-tenue">
        <p className="m-0">Il diario è vuoto.</p>
        <a
          href={indirizzi.registra}
          className="inline-flex min-h-11 items-center gap-2 rounded-[11px] bg-grafite px-4 font-semibold text-panna hover:bg-grafite-scura"
        >
          <PenLine className="size-4" aria-hidden="true" />
          Registra la prima riga
        </a>
      </div>
    )
  }

  const conferma = () => {
    if (!daEliminare) return
    onElimina(daEliminare.id)
    setDaEliminare(null)
  }

  const altre = async () => {
    setErroreAltre(null)
    setAltreInCaricamento(true)
    try {
      await onMostraAltre()
    } catch (e) {
      setErroreAltre((e as Error).message)
    } finally {
      setAltreInCaricamento(false)
    }
  }

  return (
    <div className="animate-entra flex flex-col gap-4 pt-1">
      {perGiorno(voci).map((giorno) => (
        <section key={giorno.chiave} aria-label={giorno.titolo}>
          <h2 className="m-0 mb-1.5 px-1 text-xs font-semibold tracking-wide text-testo-tenue uppercase">{giorno.titolo}</h2>
          <ul className="m-0 list-none divide-y divide-bordo overflow-hidden rounded-[11px] border border-bordo bg-white p-0">
            {giorno.voci.map((voce) => (
              <li key={voce.id} className="flex items-center gap-3 py-1 pr-1 pl-3">
                <time dateTime={voce.quando} className="shrink-0 text-sm text-testo-tenue tabular-nums">
                  {ora(voce)}
                </time>
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
                  <span className="text-xs font-semibold text-ambra-scura">{voce.soggetto}</span>
                  <span className="font-semibold break-words">{voce.chiave}</span>
                  {voce.valore !== null && <span className="ml-auto break-words tabular-nums">{voce.valore}</span>}
                </div>
                {inAttesa.has(voce.id) && (
                  <CloudUpload className="size-4 shrink-0 text-ambra-scura" aria-label="Da inviare" role="img" />
                )}
                <button
                  type="button"
                  className="grid size-10 shrink-0 place-items-center rounded-[11px] text-testo-tenue hover:bg-fondo hover:text-pericolo"
                  aria-label={`Elimina ${descrivi(voce)}`}
                  onClick={() => setDaEliminare(voce)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!finite && (
        <button
          type="button"
          disabled={altreInCaricamento}
          onClick={() => void altre()}
          className="mx-auto min-h-11 rounded-[11px] px-4 font-semibold text-grafite hover:bg-fumo disabled:opacity-60"
        >
          {altreInCaricamento ? 'Carico…' : 'Mostra altre'}
        </button>
      )}
      {erroreAltre && (
        <p className="m-0 text-center text-sm text-pericolo" role="alert">
          {erroreAltre}
        </p>
      )}
      {daEliminare && (
        <Conferma titolo="Elimina riga" conferma="Elimina" pericolo onConferma={conferma} onAnnulla={() => setDaEliminare(null)}>
          <p className="m-0">
            Elimino <strong>{descrivi(daEliminare)}</strong>? Non si torna indietro.
          </p>
        </Conferma>
      )}
    </div>
  )
}
