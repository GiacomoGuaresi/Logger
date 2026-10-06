import { describe, expect, it } from 'vitest'
import { data, ora, perGiornata, quandoBreve } from './diario'
import type { Voce } from './voce'

const FUSO = 'Europe/Rome'
const ADESSO = new Date('2026-10-06T10:00:00Z')

function alle(quando: string, chiave = 'km'): Voce {
  return { id: quando, quando, soggetto: 'moto', chiave, valore: null }
}

describe('data', () => {
  it('giorno, mese e anno a due cifre, nel fuso di chi guarda', () => {
    expect(data(alle('2026-01-02T12:00:00.000Z'), FUSO)).toBe('02/01/2026')
    // 23:30 UTC del 5 ottobre è già il 6 a Roma.
    expect(data(alle('2026-10-05T23:30:00.000Z'), FUSO)).toBe('06/10/2026')
  })
})

describe('perGiornata', () => {
  it('raggruppa le righe della stessa giornata, nel fuso di chi guarda', () => {
    const giornate = perGiornata(
      [
        alle('2026-10-06T08:00:00.000Z', 'km'),
        // 23:30 UTC del 5 ottobre è già il 6 a Roma.
        alle('2026-10-05T23:30:00.000Z', 'benzina'),
        alle('2026-10-05T12:00:00.000Z', 'km'),
        alle('2026-10-01T12:00:00.000Z', 'lavaggio'),
      ],
      FUSO,
    )
    expect(giornate.map((g) => [g.data, g.voci.map((v) => v.chiave)])).toEqual([
      ['06/10/2026', ['km', 'benzina']],
      ['05/10/2026', ['km']],
      ['01/10/2026', ['lavaggio']],
    ])
  })

  it('senza righe non ci sono giornate', () => {
    expect(perGiornata([], FUSO)).toEqual([])
  })
})

describe('ora', () => {
  it('scrive l ora locale a due cifre', () => {
    expect(ora(alle('2026-10-06T06:05:00.000Z'), FUSO)).toBe('08:05')
  })
})

describe('quandoBreve', () => {
  it('oggi e ieri con l ora, poi giorno e mese, con l anno solo se diverso', () => {
    expect(quandoBreve('2026-10-06T06:12:00.000Z', ADESSO, FUSO)).toBe('oggi 08:12')
    expect(quandoBreve('2026-10-05T16:40:00.000Z', ADESSO, FUSO)).toBe('ieri 18:40')
    expect(quandoBreve('2026-10-01T12:00:00.000Z', ADESSO, FUSO)).toBe('1 ott')
    expect(quandoBreve('2025-12-31T12:00:00.000Z', ADESSO, FUSO)).toBe('31 dic 2025')
  })
})
