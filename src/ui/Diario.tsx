import { useState } from 'react'
import { ChevronDown, ChevronLeft, CloudUpload, Plus, X } from 'lucide-react'
import type { StatoVoci } from '../dati'
import { ora, perGiornata } from '../dominio/diario'
import { confrontabile } from '../dominio/suggerimenti'
import type { Voce } from '../dominio/voce'
import { Avviso } from './Avviso'
import { ModificaVoce } from './ModificaVoce'
import { indirizzi, indirizzoRegistra } from './rotta'

interface Props {
  /** Il titolo del diario: la forma del soggetto scritta più spesso. */
  soggetto: string
  /** Le chiavi del soggetto, dalla più usata, con quante righe: il filtro sopra la timeline. */
  chiavi: readonly { testo: string; volte: number }[]
  stato: StatoVoci
  /** Le righe con una scrittura non ancora arrivata all'archivio: hanno il segno "da inviare". */
  inAttesa: ReadonlySet<string>
  onMostraAltre: () => Promise<void>
  /** Riscrive una riga che c'era già (corretta, o rimessa con Annulla). Va subito a schermo; senza rete parte dopo. */
  onModifica: (voce: Voce) => void
  /** Va subito a schermo; se manca la rete parte dopo, da sola. */
  onElimina: (id: string) => void
  onRiprova: () => void
}

function descrivi(voce: Voce): string {
  return `${voce.chiave}${voce.valore === null ? '' : ` · ${voce.valore}`}`
}

/**
 * Il diario di un soggetto (docs/02-funzionalita.md#diario): le sue righe dalla
 * più recente, su una timeline verticale da scorrere: una tappa per giornata.
 * Il filtro sopra la timeline mostra una chiave sola alla volta. In cima si
 * torna all'elenco dei diari o si aggiunge una riga a questo soggetto.
 * Toccando una riga la si corregge, data compresa, o la si elimina: subito, con
 * un avviso per annullare. Tutto funziona anche senza rete.
 */
export function Diario({ soggetto, chiavi, stato, inAttesa, onMostraAltre, onModifica, onElimina, onRiprova }: Props) {
  const [inModifica, setInModifica] = useState<Voce | null>(null)
  /** L'ultima riga eliminata, finché si può ancora annullare. */
  const [eliminata, setEliminata] = useState<Voce | null>(null)
  /** La chiave mostrata, o `null` per tutte. */
  const [filtro, setFiltro] = useState<string | null>(null)
  const [altreInCaricamento, setAltreInCaricamento] = useState(false)
  const [erroreAltre, setErroreAltre] = useState<string | null>(null)

  const elimina = (voce: Voce) => {
    onElimina(voce.id)
    setInModifica(null)
    setEliminata(voce)
  }

  const voci =
    stato.fase !== 'pronto' ? [] : filtro === null ? stato.voci : stato.voci.filter((v) => confrontabile(v.chiave) === confrontabile(filtro))

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
          href={indirizzoRegistra(soggetto)}
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
      {stato.fase === 'pronto' && stato.voci.length > 0 && chiavi.length > 1 && (
        // Una tendina nativa: sul telefono apre il selettore di sistema, che le mostra tutte, anche se sono tante.
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <select
              aria-label="Filtra per chiave"
              value={filtro ?? ''}
              onChange={(e) => setFiltro(e.target.value === '' ? null : e.target.value)}
              className={`min-h-11 w-full appearance-none truncate rounded-[11px] border pr-10 pl-3.5 outline-none focus:ring-2 focus:ring-ambra/40 ${
                filtro === null ? 'border-bordo bg-white text-testo' : 'border-grafite bg-grafite font-semibold text-panna'
              }`}
            >
              <option value="">Tutte le chiavi</option>
              {chiavi.map(({ testo, volte }) => (
                <option key={testo} value={testo}>
                  {testo} ({volte})
                </option>
              ))}
            </select>
            <ChevronDown
              className={`pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 ${filtro === null ? 'text-testo-tenue' : 'text-panna'}`}
              aria-hidden="true"
            />
          </div>
          {filtro !== null && (
            <button
              type="button"
              className="grid size-11 shrink-0 place-items-center rounded-[11px] border border-bordo bg-white text-testo-tenue active:bg-fumo"
              aria-label="Mostra tutte le chiavi"
              onClick={() => setFiltro(null)}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      {stato.fase === 'pronto' && stato.voci.length > 0 && voci.length === 0 && (
        <p className="mt-6 text-center text-testo-tenue">
          Nessuna riga «{filtro}» tra quelle caricate{stato.finite ? '' : ': prova con Mostra altre'}.
        </p>
      )}
      {voci.length > 0 && (
        // La linea passa dietro i pallini, dal primo all'ultimo.
        <ol className="relative m-0 flex list-none flex-col gap-3 p-0 before:absolute before:top-5 before:bottom-5 before:left-[11px] before:w-0.5 before:rounded-full before:bg-bordo">
          {perGiornata(voci).map((giornata, i) => (
            <li key={giornata.data} className="relative flex items-start gap-3">
              <span
                className={`relative mt-2.5 size-6 shrink-0 rounded-full border-[3px] border-fondo ${i === 0 ? 'bg-ambra' : 'bg-grafite'}`}
                aria-hidden="true"
              />
              <section
                aria-label={giornata.data}
                className="min-w-0 flex-1 rounded-[14px] border border-bordo bg-white pt-2 pb-1 pl-3.5 pr-1"
              >
                <time dateTime={giornata.data.split('/').reverse().join('-')} className="block text-[13px] text-testo-tenue tabular-nums">
                  {giornata.data}
                </time>
                <ul className="m-0 list-none divide-y divide-bordo/70 p-0">
                  {giornata.voci.map((voce) => (
                    <li key={voce.id}>
                      <button
                        type="button"
                        className="-ml-1 flex min-h-11 w-full items-center gap-2 rounded-lg py-1 pr-3 pl-1 text-left active:bg-fumo"
                        aria-label={`Modifica ${descrivi(voce)}`}
                        onClick={() => setInModifica(voce)}
                      >
                        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2" title={ora(voce)}>
                          <span className="font-semibold break-words">{voce.chiave}</span>
                          {voce.valore !== null && <span className="ml-auto text-base break-words tabular-nums">{voce.valore}</span>}
                        </span>
                        {inAttesa.has(voce.id) && (
                          <CloudUpload className="size-4 shrink-0 text-ambra-scura" aria-label="Da inviare" role="img" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </li>
          ))}
        </ol>
      )}
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
      {inModifica && (
        <ModificaVoce
          voce={inModifica}
          onSalva={(voce) => {
            onModifica(voce)
            setInModifica(null)
          }}
          onElimina={elimina}
          onChiudi={() => setInModifica(null)}
        />
      )}
      {eliminata && (
        <Avviso
          key={eliminata.id}
          testo={`Eliminata: ${descrivi(eliminata)}`}
          azione="Annulla"
          onAzione={() => {
            // Stessa riga, stesso id e stessa data: torna com'era.
            onModifica(eliminata)
            setEliminata(null)
          }}
          onScade={() => setEliminata(null)}
        />
      )}
    </div>
  )
}
