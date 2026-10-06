import { describe, expect, it } from 'vitest'
import { indirizzoDiario, indirizzoRegistra, leggiRotta } from './rotta'

describe('leggiRotta', () => {
  it('riconosce le pagine e il soggetto del diario', () => {
    expect(leggiRotta('')).toEqual({ pagina: 'registra' })
    expect(leggiRotta('#/')).toEqual({ pagina: 'registra' })
    expect(leggiRotta('#/diario')).toEqual({ pagina: 'diario' })
    expect(leggiRotta('#/diario/')).toEqual({ pagina: 'diario' })
    expect(leggiRotta('#/installa')).toEqual({ pagina: 'installa' })
    expect(leggiRotta('#/altro')).toEqual({ pagina: 'registra' })
    expect(leggiRotta('#/altro/moto')).toEqual({ pagina: 'registra' })
    expect(leggiRotta('#/registra')).toEqual({ pagina: 'registra' })
  })

  it('Registra può partire da un soggetto', () => {
    for (const soggetto of ['moto', 'Guzzi Breva', 'A/B']) {
      expect(leggiRotta(indirizzoRegistra(soggetto))).toEqual({ pagina: 'registra', soggetto })
    }
  })

  it('il soggetto fa andata e ritorno, anche con spazi, accenti e barre', () => {
    for (const soggetto of ['moto', 'Guzzi Breva', 'Città', 'A/B']) {
      expect(leggiRotta(indirizzoDiario(soggetto))).toEqual({ pagina: 'diario', soggetto })
    }
  })

  it('un indirizzo rovinato porta all elenco dei diari', () => {
    expect(leggiRotta('#/diario/%E0%A4%A')).toEqual({ pagina: 'diario' })
  })
})
