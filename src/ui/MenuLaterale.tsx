import { useEffect, useRef } from 'react'
import { BookOpen, Download, LayoutGrid, PenLine, X } from 'lucide-react'
import { confrontabile } from '../dominio/suggerimenti'
import { indirizzi, indirizzoDiario, type Rotta } from './rotta'

/** Da questa larghezza il menu è sempre aperto: la stessa soglia di `lg:`. */
const SEMPRE_APERTO = '(min-width: 1024px)'

/** Una voce del menu: la riga di Registra, di "Tutti i diari" e di ogni diario. */
const VOCE =
  'group flex min-h-11 items-center gap-3 rounded-lg px-3 hover:bg-fondo active:bg-bordo aria-[current=page]:bg-fumo aria-[current=page]:font-semibold aria-[current=page]:shadow-[inset_3px_0_0_var(--color-ambra)]'
const ICONA = 'size-[18px] shrink-0 text-testo-tenue group-aria-[current=page]:text-grafite'

interface Props {
  aperto: boolean
  corrente: Rotta
  /** I diari, uno per soggetto, con quante righe hanno: ognuno ha la sua voce. */
  diari: readonly { nome: string; volte: number }[]
  onChiudi: () => void
  /** In fondo al menu "Installa l'app", finché l'app non è installata. Se manca, la voce non c'è. */
  onInstalla?: () => void
}

/**
 * Il menu laterale a scomparsa, come nelle altre app (docs/09-interfaccia.md):
 * Registra, poi i diari, uno per soggetto in ordine alfabetico, così ogni voce
 * resta sempre allo stesso posto.
 * Resta sempre montato e scivola dentro da sinistra; si chiude toccando fuori,
 * con la X, con Esc o scegliendo una voce. Da aperto la pagina sotto non
 * scorre, e alla chiusura il fuoco torna dov'era. Da desktop è una colonna
 * fissa, sempre visibile.
 */
export function MenuLaterale({ aperto, corrente, diari, onChiudi, onInstalla }: Props) {
  const pannello = useRef<HTMLElement>(null)

  // Se la finestra si allarga col menu aperto lo si chiude, così la pagina
  // torna a scorrere.
  useEffect(() => {
    const desktop = window.matchMedia(SEMPRE_APERTO)
    const chiudi = () => {
      if (desktop.matches) onChiudi()
    }
    desktop.addEventListener('change', chiudi)
    return () => desktop.removeEventListener('change', chiudi)
  }, [onChiudi])

  useEffect(() => {
    if (!aperto) return
    const prima = document.activeElement instanceof HTMLElement ? document.activeElement : null
    pannello.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus()

    const esc = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onChiudi()
    }
    document.addEventListener('keydown', esc)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = overflow
      prima?.focus()
    }
  }, [aperto, onChiudi])

  return (
    <>
      <div
        className={`fixed inset-0 z-10 bg-testo/35 transition-[opacity,visibility] duration-200 motion-reduce:transition-none lg:hidden ${
          aperto ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        aria-hidden="true"
        onClick={onChiudi}
      />
      <nav
        id="menu"
        ref={pannello}
        aria-label="Menu"
        className={`fixed inset-y-0 left-0 z-11 flex w-[min(80vw,256px)] flex-col overflow-y-auto border-r border-bordo bg-white px-2 pt-[env(safe-area-inset-top)] pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[4px_0_16px_rgb(42_45_51/0.12)] transition-[translate,visibility] duration-200 ease-out motion-reduce:transition-none lg:visible lg:sticky lg:top-11 lg:bottom-auto lg:h-[calc(100dvh-44px)] lg:w-auto lg:translate-x-0 lg:pt-2 lg:shadow-none lg:transition-none ${
          aperto ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pl-2 lg:hidden">
          <span className="text-lg font-semibold">Logger</span>
          <button
            className="grid size-11 place-items-center rounded-[11px] text-testo-tenue active:bg-fondo"
            type="button"
            aria-label="Chiudi il menu"
            onClick={onChiudi}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <a
          href={indirizzi.registra}
          aria-current={corrente.pagina === 'registra' ? 'page' : undefined}
          onClick={onChiudi}
          className={VOCE}
        >
          <PenLine className={ICONA} aria-hidden="true" />
          Registra
        </a>
        <h2 className="m-0 mt-4 mb-1 px-3 text-xs font-semibold tracking-wide text-testo-tenue uppercase">Diari</h2>
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          <li>
            <a
              href={indirizzi.diario}
              aria-current={corrente.pagina === 'diario' && !corrente.soggetto ? 'page' : undefined}
              onClick={onChiudi}
              className={VOCE}
            >
              <LayoutGrid className={ICONA} aria-hidden="true" />
              Tutti i diari
            </a>
          </li>
          {diari.map(({ nome, volte }) => (
            <li key={nome}>
              <a
                href={indirizzoDiario(nome)}
                aria-current={
                  corrente.pagina === 'diario' && corrente.soggetto && confrontabile(corrente.soggetto) === confrontabile(nome)
                    ? 'page'
                    : undefined
                }
                onClick={onChiudi}
                className={VOCE}
              >
                <BookOpen className={ICONA} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{nome}</span>
                <span className="shrink-0 text-xs font-normal text-testo-tenue tabular-nums" aria-label={`${volte} righe`}>
                  {volte}
                </span>
              </a>
            </li>
          ))}
        </ul>
        {diari.length === 0 && <p className="m-0 px-3 py-1 text-sm text-testo-tenue">Nessuno: nascono con la prima riga.</p>}
        {/* Le voci di servizio stanno in fondo, lontane dall'uso di tutti i giorni. */}
        {onInstalla && (
          <button
            type="button"
            onClick={onInstalla}
            aria-current={corrente.pagina === 'installa' ? 'page' : undefined}
            className="group mt-auto flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-fondo active:bg-bordo aria-[current=page]:bg-fumo aria-[current=page]:font-semibold"
          >
            <Download
              className="size-[18px] text-testo-tenue group-aria-[current=page]:text-grafite"
              aria-hidden="true"
            />
            Installa l'app
          </button>
        )}
      </nav>
    </>
  )
}
