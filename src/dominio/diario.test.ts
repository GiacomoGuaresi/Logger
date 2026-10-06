import { describe, expect, it } from 'vitest'
import { ora, perGiorno, quandoBreve } from './diario'
import type { Voce } from './voce'

const FUSO = 'Europe/Rome'
const ADESSO = new Date('2026-10-06T10:00:00Z')

function alle(quando: string, chiave = 'km'): Voce {
  return { id: quando, quando, soggetto: 'moto', chiave, valore: null }
}

describe('perGiorno', () => {
  it('divide per giorno nel fuso di chi guarda, con Oggi e Ieri', () => {
    const giorni = perGiorno(
      [
        alle('2026-10-06T08:00:00.000Z'),
        // 23:30 UTC del 5 ottobre è già il 6 a Roma.
        alle('2026-10-05T23:30:00.000Z'),
        alle('2026-10-05T12:00:00.000Z'),
        alle('2026-10-01T12:00:00.000Z'),
      ],
      ADESSO,
      FUSO,
    )
    expect(giorni.map((g) => [g.titolo, g.voci.length])).toEqual([
      ['Oggi', 2],
      ['Ieri', 1],
      ['giovedì 1 ottobre', 1],
    ])
  })

  it('mette l anno solo se non è quello corrente', () => {
    const [giorno] = perGiorno([alle('2025-12-31T12:00:00.000Z')], ADESSO, FUSO)
    expect(giorno.titolo).toBe('mercoledì 31 dicembre 2025')
  })

  it('Ieri funziona anche a cavallo di mese', () => {
    const [giorno] = perGiorno([alle('2026-09-30T12:00:00.000Z')], new Date('2026-10-01T08:00:00Z'), FUSO)
    expect(giorno.titolo).toBe('Ieri')
  })

  it('senza righe non ci sono giorni', () => {
    expect(perGiorno([], ADESSO, FUSO)).toEqual([])
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
