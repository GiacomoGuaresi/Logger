import { useCallback, useState } from 'react'
import { Gauge, Menu } from 'lucide-react'
import { MenuLaterale } from './MenuLaterale'
import { Diario } from './Diario'
import { Registra } from './Registra'
import { useRotta } from './rotta'
import { useVoci } from './useVoci'

/**
 * Il guscio dell'app, come le altre app di casa (docs/09-interfaccia.md):
 * intestazione grafite da bordo a bordo con ☰ a sinistra, menu laterale,
 * contenuto stretto e centrato. Da 1024px il menu è una colonna fissa e ☰ sparisce.
 */
export function App() {
  const rotta = useRotta()
  const [menuAperto, setMenuAperto] = useState(false)
  const chiudiMenu = useCallback(() => setMenuAperto(false), [])
  const { stato, ricarica, mostraAltre, altreInCaricamento, salva, elimina } = useVoci()
  const voci = stato.fase === 'pronto' ? stato.voci : []

  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[256px_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
      <header className="sticky top-0 z-1 flex items-center gap-1 border-b border-grafite-scura bg-grafite pt-[env(safe-area-inset-top)] pr-2 pl-1 text-panna lg:col-span-full lg:min-h-11 lg:pl-3">
        <button
          className="grid size-11 place-items-center rounded-[11px] active:bg-grafite-scura lg:hidden"
          type="button"
          aria-label="Apri il menu"
          aria-expanded={menuAperto}
          aria-controls="menu"
          onClick={() => setMenuAperto(true)}
        >
          <Menu className="size-[22px]" aria-hidden="true" />
        </button>
        <Gauge className="size-[22px] shrink-0 text-ambra" aria-hidden="true" />
        <h1 className="ml-1 text-lg font-semibold tracking-[0.01em]">Logger</h1>
      </header>
      <MenuLaterale aperto={menuAperto} corrente={rotta} onChiudi={chiudiMenu} />
      <main className="mx-auto w-full max-w-[640px] flex-1 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:col-start-2">
        {/* Registra si apre subito anche mentre le righe arrivano: servono solo ai suggerimenti. */}
        {rotta === 'registra' && <Registra voci={voci} onSalva={salva} />}
        {rotta === 'diario' && stato.fase === 'caricamento' && <p className="mt-8 text-center text-testo-tenue">Carico…</p>}
        {rotta === 'diario' && stato.fase === 'errore' && (
          <p className="mt-8 px-3 text-center text-testo-tenue" role="alert">
            {stato.messaggio}{' '}
            <button type="button" className="font-semibold text-grafite underline" onClick={() => void ricarica()}>
              Riprova
            </button>
          </p>
        )}
        {rotta === 'diario' && stato.fase === 'pronto' && (
          <Diario
            voci={stato.voci}
            finite={stato.finite}
            altreInCaricamento={altreInCaricamento}
            onMostraAltre={mostraAltre}
            onElimina={elimina}
          />
        )}
      </main>
    </div>
  )
}
