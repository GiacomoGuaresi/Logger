import { useCallback, useEffect, useState } from 'react'
import { CloudOff, CloudUpload, Menu, NotebookPen } from 'lucide-react'
import { trovaSoggetto } from '../dominio/soggetti'
import { chiaviConVolte } from '../dominio/suggerimenti'
import { Diari } from './Diari'
import { Diario } from './Diario'
import { Installa } from './Installa'
import { installa, useInstallazione } from './installazione'
import { MenuLaterale } from './MenuLaterale'
import { Registra } from './Registra'
import { indirizzi, useRotta } from './rotta'
import { useVoci } from './useVoci'

/**
 * Il guscio dell'app, come le altre app di casa (docs/09-interfaccia.md):
 * intestazione grafite da bordo a bordo con ☰ a sinistra e, se ci sono righe
 * da inviare, il loro conto a destra; menu laterale, contenuto stretto e
 * centrato. Da 1024px il menu è una colonna fissa e ☰ sparisce.
 */
export function App() {
  const rotta = useRotta()
  const [menuAperto, setMenuAperto] = useState(false)
  const chiudiMenu = useCallback(() => setMenuAperto(false), [])
  const { soggetti, usi, diario, inAttesa, senzaRete, rifiutata, ricarica, apriDiario, chiudiDiario, mostraAltre, salva, modifica, elimina } =
    useVoci()
  const statoInstallazione = useInstallazione()

  // Il diario si apre (e si legge) quando l'indirizzo ne nomina uno.
  const soggettoDiario = rotta.pagina === 'diario' ? rotta.soggetto : undefined
  useEffect(() => {
    if (soggettoDiario) void apriDiario(soggettoDiario)
    else chiudiDiario()
  }, [soggettoDiario, apriDiario, chiudiDiario])

  const elenco = soggetti.fase === 'pronto' ? soggetti.elenco : []
  /** Il titolo del diario: la forma scritta più spesso, se il soggetto c'è già. */
  const titolo = soggettoDiario ? (trovaSoggetto(elenco, soggettoDiario)?.nome ?? soggettoDiario) : ''

  return (
    <div className="sfondo-officina flex min-h-dvh flex-col lg:grid lg:grid-cols-[256px_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
      <header className="sticky top-0 z-1 flex items-center gap-1 border-b border-grafite-scura bg-grafite pt-[env(safe-area-inset-top)] pr-3 pl-1 text-panna lg:col-span-full lg:min-h-11 lg:pl-3">
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
        <NotebookPen className="size-[22px] shrink-0 text-ambra" aria-hidden="true" />
        <h1 className="ml-1 text-lg font-semibold tracking-[0.01em]">Logger</h1>
        {inAttesa.size > 0 && (
          <span
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-ambra px-2.5 py-0.5 text-sm font-semibold text-grafite-scura"
            role="status"
            aria-label={inAttesa.size === 1 ? 'Una riga da inviare' : `${inAttesa.size} righe da inviare`}
          >
            <CloudUpload className="size-4" aria-hidden="true" />
            {inAttesa.size}
          </span>
        )}
      </header>
      <MenuLaterale
        aperto={menuAperto}
        corrente={rotta}
        diari={[...elenco].sort((a, b) => a.nome.localeCompare(b.nome, 'it', { sensitivity: 'base' }))}
        onChiudi={chiudiMenu}
        onInstalla={
          statoInstallazione === 'installata'
            ? undefined
            : () => {
                setMenuAperto(false)
                // Dove il browser ha dato il suo prompt basta un tocco; dove no,
                // si aprono le istruzioni.
                if (statoInstallazione === 'pronta') void installa()
                else window.location.hash = indirizzi.installa
              }
        }
      />
      <main className="mx-auto w-full max-w-[640px] flex-1 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:col-start-2">
        {senzaRete && soggetti.fase === 'pronto' && (
          <p className="mt-0 mb-3 flex items-start gap-2 rounded-[11px] bg-fumo px-3 py-2 text-sm text-testo-tenue" role="status">
            <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>Il Mac non risponde: vedi le righe salvate su questo dispositivo, quelle nuove partono quando torna.</span>
          </p>
        )}
        {rifiutata && (
          <p className="mt-0 mb-3 rounded-[11px] bg-pericolo/10 px-3 py-2 text-sm text-pericolo" role="alert">
            Una riga è stata rifiutata e non è stata salvata: {rifiutata}
          </p>
        )}
        {rotta.pagina === 'installa' && <Installa stato={statoInstallazione} />}
        {/* Registra si apre subito anche mentre le righe arrivano: le scelte vengono dalla memoria del dispositivo. */}
        {rotta.pagina === 'registra' && (
          <Registra key={rotta.soggetto ?? ''} soggettoIniziale={rotta.soggetto ?? ''} usi={usi} inAttesa={inAttesa} onSalva={salva} />
        )}
        {rotta.pagina === 'diario' && !rotta.soggetto && soggetti.fase === 'caricamento' && (
          <p className="mt-8 text-center text-testo-tenue">Carico…</p>
        )}
        {rotta.pagina === 'diario' && !rotta.soggetto && soggetti.fase === 'errore' && (
          <p className="mt-8 px-3 text-center text-testo-tenue" role="alert">
            {soggetti.messaggio}{' '}
            <button type="button" className="font-semibold text-grafite underline" onClick={() => void ricarica()}>
              Riprova
            </button>
          </p>
        )}
        {rotta.pagina === 'diario' && !rotta.soggetto && soggetti.fase === 'pronto' && <Diari soggetti={soggetti.elenco} />}
        {rotta.pagina === 'diario' && rotta.soggetto && diario && (
          <Diario
            // Un altro diario riparte senza filtro.
            key={rotta.soggetto}
            soggetto={titolo}
            chiavi={chiaviConVolte(usi, rotta.soggetto)}
            stato={diario.stato}
            inAttesa={inAttesa}
            onMostraAltre={mostraAltre}
            onModifica={modifica}
            onElimina={elimina}
            onRiprova={() => void ricarica()}
          />
        )}
      </main>
    </div>
  )
}
