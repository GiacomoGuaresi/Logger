import { useEffect, useSyncExternalStore } from 'react'
import { sincronizzatore } from '../dati'

/** Con scritture in attesa si riprova ogni tanto, anche se nessuno tocca niente. */
const RIPROVA_MS = 30_000

const iscriviti = (avvisa: () => void) => sincronizzatore.iscriviti(avvisa)
const leggi = () => sincronizzatore.leggi()
// Stabili, per gli effetti che aprono e chiudono il diario seguendo l'indirizzo.
const apriDiario = (soggetto: string) => sincronizzatore.apriDiario(soggetto)
const chiudiDiario = () => sincronizzatore.chiudiDiario()

/**
 * Il riepilogo (card dei diari e scelte di Registra) e il diario aperto
 * (docs/03-architettura.md#senza-rete). All'apertura si vede subito quello in
 * memoria; si rilegge l'archivio, e si manda la coda, quando l'app si apre,
 * torna la rete o torna in primo piano.
 */
export function useVoci() {
  const istantanea = useSyncExternalStore(iscriviti, leggi)
  const quanteInAttesa = istantanea.inAttesa.size

  useEffect(() => {
    const aggiorna = () => void sincronizzatore.aggiorna()
    const inPrimoPiano = () => {
      if (document.visibilityState === 'visible') aggiorna()
    }
    aggiorna()
    window.addEventListener('online', aggiorna)
    document.addEventListener('visibilitychange', inPrimoPiano)
    return () => {
      window.removeEventListener('online', aggiorna)
      document.removeEventListener('visibilitychange', inPrimoPiano)
    }
  }, [])

  useEffect(() => {
    if (quanteInAttesa === 0) return
    const ogni = setInterval(() => void sincronizzatore.aggiorna(), RIPROVA_MS)
    return () => clearInterval(ogni)
  }, [quanteInAttesa])

  return {
    ...istantanea,
    ricarica: () => sincronizzatore.aggiorna(),
    apriDiario,
    chiudiDiario,
    mostraAltre: () => sincronizzatore.mostraAltre(),
    salva: (voce: Parameters<typeof sincronizzatore.salva>[0]) => sincronizzatore.salva(voce),
    elimina: (id: string) => sincronizzatore.elimina(id),
  }
}
