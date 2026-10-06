import { describe, expect, it } from 'vitest'
import { soggettiRiassunti, trovaSoggetto } from './soggetti'
import type { Uso } from './suggerimenti'

function uso(soggetto: string, chiave: string, volte: number, ultimaVolta: string, valore?: string): Uso {
  return { soggetto, chiave, volte, ultimaVolta, ultimoValore: valore === undefined ? null : { valore, quando: ultimaVolta } }
}

const usi: Uso[] = [
  uso('moto', 'km', 5, '2026-10-03T08:00:00.000Z', '41000'),
  uso('Moto', 'km', 1, '2026-10-01T08:00:00.000Z', '40500'),
  uso('moto', 'Benzina', 2, '2026-10-02T08:00:00.000Z', '25€'),
  uso('moto', 'Catena', 1, '2026-09-02T08:00:00.000Z'),
  uso('moto', 'Gomme', 1, '2026-09-01T08:00:00.000Z', 'nuove'),
  uso('auto', 'Controllo olio', 1, '2026-10-05T08:00:00.000Z'),
]

describe('soggettiRiassunti', () => {
  it('un diario per soggetto, raccogliendo le forme scritte, dal più recente', () => {
    const diari = soggettiRiassunti(usi)
    expect(diari.map((d) => [d.nome, d.forme, d.volte, d.ultimaVolta])).toEqual([
      ['auto', ['auto'], 1, '2026-10-05T08:00:00.000Z'],
      ['moto', ['Moto', 'moto'], 10, '2026-10-03T08:00:00.000Z'],
    ])
  })

  it('anteprima con le chiavi più usate e il loro ultimo valore', () => {
    const [, moto] = soggettiRiassunti(usi)
    expect(moto.chiavi).toEqual([
      { nome: 'km', ultimoValore: '41000' },
      { nome: 'Benzina', ultimoValore: '25€' },
      { nome: 'Catena', ultimoValore: null },
    ])
  })

  it('senza righe non ci sono diari', () => {
    expect(soggettiRiassunti([])).toEqual([])
  })
})

describe('trovaSoggetto', () => {
  it('trova il diario dal nome nell indirizzo, senza badare a maiuscole', () => {
    const diari = soggettiRiassunti(usi)
    expect(trovaSoggetto(diari, 'MOTO')?.nome).toBe('moto')
    expect(trovaSoggetto(diari, 'barca')).toBeNull()
  })
})
