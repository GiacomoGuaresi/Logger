// Un archivio tutto in memoria, per i test del sincronizzatore: stesso
// contratto di ArchivioSupabase (contratto.ts), senza rete né database.

import type { Uso } from '../dominio/suggerimenti'
import type { Voce } from '../dominio/voce'
import type { Archivio, OpzioniLettura } from './archivio'

/** Dalla più recente; a parità di data decide l'id, come `order by quando desc, id desc`. */
const piuRecente = (a: Voce, b: Voce) => b.quando.localeCompare(a.quando) || b.id.localeCompare(a.id)

export class ArchivioInMemoria implements Archivio {
  private readonly voci = new Map<string, Voce>()

  async leggi({ soggetti, prima, limite }: OpzioniLettura): Promise<Voce[]> {
    return [...this.voci.values()]
      .filter((v) => (!soggetti || soggetti.includes(v.soggetto)) && (!prima || v.quando < prima))
      .sort(piuRecente)
      .slice(0, limite)
  }

  async usi(): Promise<Uso[]> {
    const coppie = new Map<string, Uso>()
    for (const v of [...this.voci.values()].sort(piuRecente).reverse()) {
      const chiave = JSON.stringify([v.soggetto, v.chiave])
      const uso = coppie.get(chiave) ?? { soggetto: v.soggetto, chiave: v.chiave, volte: 0, ultimaVolta: v.quando, ultimoValore: null }
      uso.volte += 1
      uso.ultimaVolta = v.quando
      if (v.valore !== null) uso.ultimoValore = { valore: v.valore, quando: v.quando }
      coppie.set(chiave, uso)
    }
    return [...coppie.values()]
  }

  async salva(voce: Voce): Promise<void> {
    this.voci.set(voce.id, { ...voce })
  }

  async elimina(id: string): Promise<void> {
    this.voci.delete(id)
  }
}
