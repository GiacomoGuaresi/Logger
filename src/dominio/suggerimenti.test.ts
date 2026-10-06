import { describe, expect, it } from 'vitest'
import { chiaviUsate, confrontabile, conVoce, filtra, soggettiUsati, ultimoValore, type Uso } from './suggerimenti'
import type { Voce } from './voce'

function uso(soggetto: string, chiave: string, volte: number, ultimaVolta: string, valore?: string): Uso {
  return { soggetto, chiave, volte, ultimaVolta, ultimoValore: valore === undefined ? null : { valore, quando: ultimaVolta } }
}

const usi: Uso[] = [
  uso('moto', 'km', 5, '2026-10-06T08:00:00.000Z', '41000'),
  uso('Moto', 'km', 1, '2026-10-01T08:00:00.000Z', '40500'),
  uso('moto', 'Benzina', 2, '2026-10-05T08:00:00.000Z', '25€'),
  uso('auto', 'Controllo olio', 1, '2026-10-04T08:00:00.000Z'),
  uso('auto', 'km', 1, '2026-10-03T08:00:00.000Z', '128450'),
  uso('bici', 'Catena', 1, '2025-01-01T08:00:00.000Z'),
]

describe('confrontabile', () => {
  it('ignora maiuscole, accenti e spazi ai bordi', () => {
    expect(confrontabile('  Pressione GÒMME ')).toBe('pressione gomme')
  })
})

describe('soggettiUsati', () => {
  it('tutti, dai più usati, nella forma scritta più spesso', () => {
    expect(soggettiUsati(usi)).toEqual(['moto', 'auto', 'bici'])
  })

  it('a parità d uso viene prima quello usato più di recente', () => {
    expect(soggettiUsati([uso('auto', 'km', 1, '2026-01-01'), uso('moto', 'km', 1, '2026-02-01')])).toEqual(['moto', 'auto'])
  })

  it('senza righe non ci sono scelte', () => {
    expect(soggettiUsati([])).toEqual([])
  })
})

describe('chiaviUsate', () => {
  it('solo quelle del soggetto, anche se scritto in un altro modo', () => {
    expect(chiaviUsate(usi, ' MOTO ')).toEqual(['km', 'Benzina'])
  })

  it('con il soggetto vuoto, quelle di tutti', () => {
    expect(chiaviUsate(usi, '')).toEqual(['km', 'Benzina', 'Controllo olio', 'Catena'])
  })

  it('un soggetto nuovo non ha scelte', () => {
    expect(chiaviUsate(usi, 'barca')).toEqual([])
  })
})

describe('ultimoValore', () => {
  it('il più recente della coppia, tra tutte le forme scritte', () => {
    expect(ultimoValore(usi, 'Moto', 'KM')).toBe('41000')
    expect(ultimoValore(usi, 'auto', 'km')).toBe('128450')
  })

  it('null se la coppia non ha mai avuto un valore, o non esiste', () => {
    expect(ultimoValore(usi, 'auto', 'Controllo olio')).toBeNull()
    expect(ultimoValore(usi, 'barca', 'km')).toBeNull()
    expect(ultimoValore(usi, 'moto', '')).toBeNull()
  })
})

describe('conVoce', () => {
  const voce = (quando: string, valore: string | null, chiave = 'km'): Voce => ({ id: quando, quando, soggetto: 'moto', chiave, valore })

  it('aggiorna la coppia esistente con l ultimo valore', () => {
    const dopo = conVoce(usi, voce('2026-10-07T08:00:00.000Z', '41200'))
    expect(dopo[0]).toEqual(uso('moto', 'km', 6, '2026-10-07T08:00:00.000Z', '41200'))
    expect(dopo).toHaveLength(usi.length)
  })

  it('una riga senza valore non cancella l ultimo valore', () => {
    expect(conVoce(usi, voce('2026-10-07T08:00:00.000Z', null))[0].ultimoValore?.valore).toBe('41000')
  })

  it('una coppia nuova si aggiunge', () => {
    const dopo = conVoce(usi, voce('2026-10-07T08:00:00.000Z', '2,2 bar', 'Pressione gomme'))
    expect(dopo.at(-1)).toEqual(uso('moto', 'Pressione gomme', 1, '2026-10-07T08:00:00.000Z', '2,2 bar'))
  })
})

describe('filtra', () => {
  const scelte = ['km', 'Benzina', 'Controllo olio', 'Olio freni']

  it('senza testo dà tutte le scelte', () => {
    expect(filtra(scelte, ' ')).toEqual(scelte)
  })

  it('prima quelle che iniziano col testo, poi quelle che lo contengono', () => {
    expect(filtra(scelte, 'OLIO')).toEqual(['Olio freni', 'Controllo olio'])
  })

  it('niente se nessuna contiene il testo', () => {
    expect(filtra(scelte, 'gomme')).toEqual([])
  })
})
