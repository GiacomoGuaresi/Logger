import { describe, expect, it } from 'vitest'
import { chiaviUsate, soggettiUsati } from './suggerimenti'
import type { Voce } from './voce'

let n = 0
function riga(soggetto: string, chiave: string): Voce {
  n += 1
  return { id: String(n), quando: '2026-10-06T08:00:00.000Z', soggetto, chiave, valore: null }
}

// Dalla più recente, come arrivano dall'archivio.
const voci = [
  riga('moto', 'km'),
  riga('Auto', 'Controllo olio'),
  riga('moto', 'Benzina'),
  riga('Moto', 'km'),
  riga('auto', 'km'),
  riga('moto', 'KM'),
  riga('bici', 'Catena'),
]

describe('soggettiUsati', () => {
  it('dai più usati, senza badare alle maiuscole, nella forma scritta più spesso', () => {
    expect(soggettiUsati(voci)).toEqual(['moto', 'Auto', 'bici'])
  })

  it('a parità d uso viene prima quello usato più di recente', () => {
    expect(soggettiUsati([riga('auto', 'km'), riga('moto', 'km')])).toEqual(['auto', 'moto'])
  })

  it('rispetta il massimo', () => {
    expect(soggettiUsati(voci, 1)).toEqual(['moto'])
  })
})

describe('chiaviUsate', () => {
  it('solo quelle del soggetto, anche se scritto in un altro modo', () => {
    expect(chiaviUsate(voci, ' MOTO ')).toEqual(['km', 'Benzina'])
  })

  it('con il soggetto vuoto, quelle di tutti', () => {
    expect(chiaviUsate(voci, '')).toEqual(['km', 'Controllo olio', 'Benzina', 'Catena'])
  })

  it('un soggetto nuovo non ha suggerimenti', () => {
    expect(chiaviUsate(voci, 'barca')).toEqual([])
  })
})
