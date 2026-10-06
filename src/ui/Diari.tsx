import { ChevronRight, PenLine } from 'lucide-react'
import { quandoBreve } from '../dominio/diario'
import type { Soggetto } from '../dominio/soggetti'
import { indirizzi, indirizzoDiario } from './rotta'

interface Props {
  soggetti: readonly Soggetto[]
}

/**
 * La pagina Diario (docs/02-funzionalita.md#diario): prima si sceglie il
 * soggetto, una card per diario, dal più recente. Ogni card dice quante righe
 * ha, quando è stata scritta l'ultima e l'ultimo valore delle chiavi più usate.
 */
export function Diari({ soggetti }: Props) {
  if (soggetti.length === 0) {
    return (
      <div className="animate-entra mt-10 flex flex-col items-center gap-3 text-center text-testo-tenue">
        <p className="m-0">Nessun diario: nasce con la prima riga di un soggetto.</p>
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

  return (
    <nav aria-label="Diari" className="animate-entra pt-1">
      <h2 className="m-0 mb-2 px-1 text-xs font-semibold tracking-wide text-testo-tenue uppercase">Scegli il diario</h2>
      <ul className="m-0 grid list-none gap-2.5 p-0">
        {soggetti.map((s) => (
          <li key={s.nome}>
            <a
              href={indirizzoDiario(s.nome)}
              className="group flex items-center gap-3 rounded-[14px] border border-bordo bg-white p-4 shadow-[0_1px_2px_rgb(42_45_51/0.06)] transition-colors hover:border-grafite active:bg-fumo"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 truncate text-lg font-semibold">{s.nome}</span>
                  <span className="ml-auto shrink-0 text-sm text-testo-tenue">{quandoBreve(s.ultimaVolta)}</span>
                </div>
                <span className="text-sm text-testo-tenue">{s.volte === 1 ? '1 riga' : `${s.volte} righe`}</span>
                {s.chiavi.length > 0 && (
                  <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Ultimi valori">
                    {s.chiavi.map((c) => (
                      <li key={c.nome} className="max-w-full truncate rounded-full bg-fondo px-2.5 py-0.5 text-sm">
                        <span className="font-semibold">{c.nome}</span>
                        {c.ultimoValore !== null && <span className="text-testo-tenue"> · {c.ultimoValore}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <ChevronRight
                className="size-5 shrink-0 text-testo-tenue transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
