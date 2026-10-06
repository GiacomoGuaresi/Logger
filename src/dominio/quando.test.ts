import { describe, expect, it } from 'vitest'
import { daCampo, etichetta, ilGiornoPrima, perCampo } from './quando'

const FUSO = 'Europe/Rome'
const ADESSO = new Date('2026-10-06T16:40:00Z') // 18:40 a Roma

describe('perCampo e daCampo', () => {
  it('fanno andata e ritorno in ora locale, al minuto', () => {
    const data = new Date(2026, 9, 2, 8, 5, 33)
    expect(perCampo(data)).toBe('2026-10-02T08:05')
    expect(daCampo(perCampo(data))).toEqual(new Date(2026, 9, 2, 8, 5))
  })

  it('un campo vuoto o rovinato non è una data', () => {
    expect(daCampo('')).toBeNull()
    expect(daCampo('2026-10-02')).toBeNull()
    expect(daCampo('2026-13-45T99:99')).toBeNull()
  })
})

describe('ilGiornoPrima', () => {
  it('stessa ora, un giorno prima, anche a cavallo di mese', () => {
    expect(ilGiornoPrima(new Date(2026, 9, 1, 18, 40))).toEqual(new Date(2026, 8, 30, 18, 40))
  })
})

describe('etichetta', () => {
  it('oggi e ieri con l ora, poi giorno e mese, con l anno solo se diverso', () => {
    expect(etichetta(new Date('2026-10-06T06:12:00Z'), ADESSO, FUSO)).toBe('Oggi 08:12')
    expect(etichetta(new Date('2026-10-05T16:40:00Z'), ADESSO, FUSO)).toBe('Ieri 18:40')
    expect(etichetta(new Date('2026-10-02T16:40:00Z'), ADESSO, FUSO)).toBe('02/10 18:40')
    expect(etichetta(new Date('2025-12-31T16:40:00Z'), ADESSO, FUSO)).toBe('31/12/2025 17:40')
  })
})
