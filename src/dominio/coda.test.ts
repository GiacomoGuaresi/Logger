import { describe, expect, it } from 'vitest'
import { accoda, applica, conVoce, inAttesa, type Scrittura } from './coda'
import type { Voce } from './voce'

function voce(id: string, quando: string, valore: string | null = null): Voce {
  return { id, quando, soggetto: 'moto', chiave: 'km', valore }
}

const a = voce('a', '2026-10-06T08:00:00.000Z', '1')
const b = voce('b', '2026-10-06T09:00:00.000Z', '2')
const c = voce('c', '2026-10-06T07:00:00.000Z', '3')

describe('accoda', () => {
  it('aggiunge in fondo', () => {
    const coda = accoda(accoda([], { tipo: 'salva', voce: a }), { tipo: 'salva', voce: b })
    expect(coda.map((s) => s.tipo === 'salva' && s.voce.id)).toEqual(['a', 'b'])
  })

  it('per la stessa riga tiene solo l ultima scrittura', () => {
    let coda: Scrittura[] = []
    coda = accoda(coda, { tipo: 'salva', voce: a })
    coda = accoda(coda, { tipo: 'salva', voce: b })
    coda = accoda(coda, { tipo: 'elimina', id: 'a' })
    expect(coda).toEqual([
      { tipo: 'salva', voce: b },
      { tipo: 'elimina', id: 'a' },
    ])
  })
})

describe('applica', () => {
  it('mette le righe in coda al loro posto e toglie quelle da eliminare', () => {
    const coda: Scrittura[] = [
      { tipo: 'salva', voce: b },
      { tipo: 'elimina', id: 'c' },
    ]
    expect(applica([a, c], coda).map((v) => v.id)).toEqual(['b', 'a'])
  })

  it('una riga modificata in coda sostituisce quella letta', () => {
    const nuova = voce('a', a.quando, '99')
    expect(applica([a], [{ tipo: 'salva', voce: nuova }])).toEqual([nuova])
  })
})

describe('conVoce', () => {
  it('tiene l ordine dalla più recente', () => {
    expect(conVoce([b, c], a).map((v) => v.id)).toEqual(['b', 'a', 'c'])
  })
})

describe('inAttesa', () => {
  it('raccoglie gli id della coda', () => {
    expect([...inAttesa([{ tipo: 'salva', voce: a }, { tipo: 'elimina', id: 'c' }])]).toEqual(['a', 'c'])
  })
})
