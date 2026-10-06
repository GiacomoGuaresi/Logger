import { useState } from 'react'
import { ChevronLeft, CloudUpload, Plus, Trash2 } from 'lucide-react'
import type { StatoVoci } from '../dati'
import { ora, perGiorno } from '../dominio/diario'
import type { Voce } from '../dominio/voce'
import { Conferma } from './Conferma'
import { salvaUltimoSoggetto } from './preferenze'
import { indirizzi } from './rotta'

interface Props {
  /** Il titolo del diario: la forma del soggetto scritta più spesso. */
  soggetto: string
  stato: StatoVoci
  /** Le righe con una scrittura non ancora arrivata al Mac: hanno il segno "da inviare". */
  inAttesa: ReadonlySet<string>
  onMostraAltre: () => Promise<void>
  /** Va subito a schermo; se manca la rete parte dopo, da sola. */
  onElimina: (id: string) => void
  onRiprova: () => void
}

function descrivi(voce: Voce): string {
  return `${voce.chiave}${voce.valore === null ? '' : ` · ${voce.valore}`}`
}

/**
 * Il diario di un soggetto (docs/02-funzionalita.md#diario): le sue righe dalla
 * più recente, raggruppate per giorno. In cima si torna all'elenco dei diari o
 * si aggiunge una riga a questo soggetto. Il cestino, dietro una conferma,
 * serve per gli errori di battitura, anche senza rete.
 */
export function Diario({ soggetto, stato, inAttesa, onMostraAltre, onElimina, onRiprova }: Props) {
  const [daEliminare, setDaEliminare] = useState<Voce | null>(null)
  const [altreInCaricamento, setAltreInCaricamento] = useState(false)
  const [erroreAltre, setErroreAltre] = useState<string | null>(null)

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
      <div className="flex items-center gap-1">
        <a
          href={indirizzi.diario}
          className="-ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-[11px] pr-2.5 pl-1 font-semibold text-testo-tenue hover:bg-fumo"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
          Diari
        </a>
        <h2 className="m-0 min-w-0 flex-1 truncate px-1 text-xl font-semibold">{soggetto}</h2>
        <a
          href={indirizzi.registra}
          // Registra parte da questo soggetto: legge l'ultimo usato quando si apre.
          onClick={() => salvaUltimoSoggetto(soggetto)}
          aria-label={`Nuova riga per ${soggetto}`}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[11px] bg-grafite px-3 font-semibold text-panna hover:bg-grafite-scura"
        >
          <Plus className="size-4" aria-hidden="true" />
          Riga
        </a>
      </div>

      {stato.fase === 'caricamento' && <p className="mt-6 text-center text-testo-tenue">Carico…</p>}
      {stato.fase === 'errore' && (
        <p className="mt-6 px-3 text-center text-testo-tenue" role="alert">
          {stato.messaggio}{' '}
          <button type="button" className="font-semibold text-grafite underline" onClick={onRiprova}>
            Riprova
          </button>
        </p>
      )}
      {stato.fase === 'pronto' && stato.voci.length === 0 && (
        <p className="mt-6 text-center text-testo-tenue">Nessuna riga per {soggetto}.</p>
      )}
      {stato.fase === 'pronto' &&
        perGiorno(stato.voci).map((giorno) => (
          <section key={giorno.chiave} aria-label={giorno.titolo}>
            <h3 className="m-0 mb-1.5 px-1 text-xs font-semibold tracking-wide text-testo-tenue uppercase">{giorno.titolo}</h3>
            <ul className="m-0 list-none divide-y divide-bordo overflow-hidden rounded-[14px] border border-bordo bg-white p-0">
              {giorno.voci.map((voce) => (
                <li key={voce.id} className="flex items-center gap-3 py-1 pr-1 pl-3.5">
                  <time dateTime={voce.quando} className="shrink-0 text-sm text-testo-tenue tabular-nums">
                    {ora(voce)}
                  </time>
                  <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
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
      {stato.fase === 'pronto' && !stato.finite && (
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
            Elimino <strong>{descrivi(daEliminare)}</strong> da {soggetto}? Non si torna indietro.
          </p>
        </Conferma>
      )}
    </div>
  )
}
