import { describe, expect, it } from 'vitest'
import { conUnita, eNumero, unitaDi } from './numero'

describe('unitaDi', () => {
  it('un numero nudo non ha unità', () => {
    expect(unitaDi('41000')).toBe('')
    expect(unitaDi('1,5')).toBe('')
  })
  it("l'unità dopo il numero, con lo spazio se c'era", () => {
    expect(unitaDi('25€')).toBe('€')
    expect(unitaDi('1,5 l')).toBe(' l')
    expect(unitaDi('41000 km')).toBe(' km')
  })
  it('null se non è un numero, o non c è', () => {
    expect(unitaDi('rabbocco mezzo litro')).toBeNull()
    expect(unitaDi('€25')).toBeNull()
    expect(unitaDi('12/10')).toBeNull()
    expect(unitaDi('3 litri di olio 5w40')).toBeNull()
    expect(unitaDi(null)).toBeNull()
  })
})

describe('eNumero', () => {
  it('numeri con la virgola o il punto, spazi ai bordi compresi', () => {
    expect(eNumero(' 27 ')).toBe(true)
    expect(eNumero('27,50')).toBe(true)
    expect(eNumero('27€')).toBe(false)
    expect(eNumero('')).toBe(false)
  })
})

describe('conUnita', () => {
  it('un numero nudo prende l unità', () => {
    expect(conUnita('27', '€')).toBe('27€')
    expect(conUnita(' 42100 ', ' km')).toBe('42100 km')
  })
  it('il resto resta com è', () => {
    expect(conUnita('27€', '€')).toBe('27€')
    expect(conUnita('pieno', '€')).toBe('pieno')
    expect(conUnita('27', '')).toBe('27')
    expect(conUnita('27', null)).toBe('27')
    expect(conUnita('', '€')).toBe('')
  })
})
