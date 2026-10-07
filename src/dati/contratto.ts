// I test di contratto dell'Archivio: quello che il resto dell'app si aspetta da
// qualunque implementazione abbia sotto (docs/03-architettura.md), come in
// Grocery. Oggi li eseguono server/archivioSqlite.test.ts e archivioHttp.test.ts;
// nella Fase 2 li eseguirà anche ArchivioSupabase.

import { describe, expect, it } from 'vitest'
import type { Voce } from '../dominio/voce'
import type { Archivio } from './archivio'

/** Un id da uuid, diverso per ogni `n`. */
export function idDi(n: number): string {
  return `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`
}

export function voce(n: number, campi: Partial<Voce> = {}): Voce {
  return {
    id: idDi(n),
    quando: `2026-10-06T08:${n.toString().padStart(2, '0')}:00.000Z`,
    soggetto: 'moto',
    chiave: 'km',
    valore: String(41000 + n),
    ...campi,
  }
}

/** `apriVuoto` dà un archivio senza niente dentro, uno nuovo a ogni test. */
export function verificaContratto(apriVuoto: () => Promise<Archivio>): void {
  describe('contratto dell archivio', () => {
    it('vuoto non ha righe', async () => {
      const archivio = await apriVuoto()
      expect(await archivio.leggi({ limite: 100 })).toEqual([])
    })

    it('rilegge una riga salvata così com era, anche senza valore', async () => {
      const archivio = await apriVuoto()
      const olio = voce(1, { soggetto: 'auto', chiave: 'Controllo olio', valore: null })
      await archivio.salva(olio)
      expect(await archivio.leggi({ limite: 100 })).toEqual([olio])
    })

    it('restituisce le righe dalla più recente', async () => {
      const archivio = await apriVuoto()
      await archivio.salva(voce(2))
      await archivio.salva(voce(3))
      await archivio.salva(voce(1))
      expect((await archivio.leggi({ limite: 100 })).map((v) => v.id)).toEqual([idDi(3), idDi(2), idDi(1)])
    })

    it('salvare due volte lo stesso id sovrascrive senza doppioni', async () => {
      const archivio = await apriVuoto()
      await archivio.salva(voce(1))
      await archivio.salva(voce(1))
      await archivio.salva(voce(1, { valore: '25€', chiave: 'Benzina' }))
      expect(await archivio.leggi({ limite: 100 })).toEqual([voce(1, { valore: '25€', chiave: 'Benzina' })])
    })

    it('legge una pagina alla volta con limite e prima', async () => {
      const archivio = await apriVuoto()
      for (const n of [1, 2, 3, 4, 5]) await archivio.salva(voce(n))
      const prima = await archivio.leggi({ limite: 2 })
      expect(prima.map((v) => v.id)).toEqual([idDi(5), idDi(4)])
      const dopo = await archivio.leggi({ limite: 2, prima: prima[1].quando })
      expect(dopo.map((v) => v.id)).toEqual([idDi(3), idDi(2)])
    })

    it('legge solo le righe dei soggetti chiesti, scritti esattamente così', async () => {
      const archivio = await apriVuoto()
      await archivio.salva(voce(1))
      await archivio.salva(voce(2, { soggetto: 'Moto' }))
      await archivio.salva(voce(3, { soggetto: 'auto' }))
      await archivio.salva(voce(4, { soggetto: 'Guzzi Breva' }))
      const di = async (soggetti: string[], prima?: string) =>
        (await archivio.leggi({ soggetti, limite: 100, prima })).map((v) => v.id)
      expect(await di(['moto', 'Moto'])).toEqual([idDi(2), idDi(1)])
      expect(await di(['Guzzi Breva'])).toEqual([idDi(4)])
      expect(await di(['moto', 'Moto'], voce(2).quando)).toEqual([idDi(1)])
      expect(await di(['barca'])).toEqual([])
      expect(await di([])).toEqual([])
    })

    it('riepiloga le coppie soggetto · chiave con quante volte e l ultimo valore non vuoto', async () => {
      const archivio = await apriVuoto()
      expect(await archivio.usi()).toEqual([])
      await archivio.salva(voce(1, { valore: '41000' }))
      await archivio.salva(voce(3, { valore: '41200' }))
      await archivio.salva(voce(4, { valore: null }))
      await archivio.salva(voce(2, { soggetto: 'auto', chiave: 'Controllo olio', valore: null }))
      const usi = await archivio.usi()
      const per = (soggetto: string) => usi.find((u) => u.soggetto === soggetto)
      expect(usi).toHaveLength(2)
      expect(per('moto')).toEqual({
        soggetto: 'moto',
        chiave: 'km',
        volte: 3,
        ultimaVolta: voce(4).quando,
        ultimoValore: { valore: '41200', quando: voce(3).quando },
      })
      expect(per('auto')).toEqual({
        soggetto: 'auto',
        chiave: 'Controllo olio',
        volte: 1,
        ultimaVolta: voce(2).quando,
        ultimoValore: null,
      })
    })

    it('elimina una riga, e una che non c è non è un errore', async () => {
      const archivio = await apriVuoto()
      await archivio.salva(voce(1))
      await archivio.salva(voce(2))
      await archivio.elimina(idDi(1))
      await archivio.elimina(idDi(1))
      await archivio.elimina(idDi(99))
      expect((await archivio.leggi({ limite: 100 })).map((v) => v.id)).toEqual([idDi(2)])
    })
  })
}
