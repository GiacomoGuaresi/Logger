import { describe, expect, it } from 'vitest'
import { nuovaVoce, pulisci, validaVoce } from './voce'

const ID = '0f8fad5b-d9cb-469f-a165-70867728950e'
const ORA = new Date('2026-10-06T08:12:00.000Z')

describe('pulisci', () => {
  it('toglie gli spazi in testa e in coda e riduce quelli in mezzo', () => {
    expect(pulisci('  Controllo   olio \n')).toBe('Controllo olio')
  })
})

describe('nuovaVoce', () => {
  it('mette id e ora, e ripulisce i campi', () => {
    expect(nuovaVoce({ soggetto: ' moto ', chiave: 'km', valore: ' 41000 ' }, ORA, ID)).toEqual({
      ok: true,
      voce: { id: ID, quando: '2026-10-06T08:12:00.000Z', soggetto: 'moto', chiave: 'km', valore: '41000' },
    })
  })

  it('un valore vuoto diventa null: la riga è solo un segno "fatto"', () => {
    const esito = nuovaVoce({ soggetto: 'auto', chiave: 'Controllo olio', valore: '   ' }, ORA, ID)
    expect(esito.ok && esito.voce.valore).toBeNull()
  })

  it('soggetto e chiave sono obbligatori', () => {
    expect(nuovaVoce({ soggetto: ' ', chiave: 'km', valore: '' }, ORA, ID)).toEqual({ ok: false, errore: 'Il soggetto è vuoto' })
    expect(nuovaVoce({ soggetto: 'moto', chiave: '', valore: '' }, ORA, ID)).toEqual({ ok: false, errore: 'La chiave è vuota' })
  })

  it('rispetta le lunghezze massime', () => {
    expect(nuovaVoce({ soggetto: 'x'.repeat(51), chiave: 'km', valore: '' }, ORA, ID).ok).toBe(false)
    expect(nuovaVoce({ soggetto: 'moto', chiave: 'x'.repeat(51), valore: '' }, ORA, ID).ok).toBe(false)
    expect(nuovaVoce({ soggetto: 'moto', chiave: 'km', valore: 'x'.repeat(201) }, ORA, ID).ok).toBe(false)
    expect(nuovaVoce({ soggetto: 'x'.repeat(50), chiave: 'x'.repeat(50), valore: 'x'.repeat(200) }, ORA, ID).ok).toBe(true)
  })

  it('genera un id nuovo ogni volta', () => {
    const a = nuovaVoce({ soggetto: 'moto', chiave: 'km', valore: '1' })
    const b = nuovaVoce({ soggetto: 'moto', chiave: 'km', valore: '1' })
    expect(a.ok && b.ok && a.voce.id !== b.voce.id).toBe(true)
  })
})

describe('validaVoce', () => {
  const buona = { id: ID, quando: '2026-10-06T10:12:00+02:00', soggetto: 'moto', chiave: 'km', valore: '41000' }

  it('riscrive la data in ISO UTC e l id in minuscolo', () => {
    expect(validaVoce({ ...buona, id: ID.toUpperCase() })).toEqual({
      ok: true,
      voce: { ...buona, quando: '2026-10-06T08:12:00.000Z' },
    })
  })

  it('accetta il valore mancante o null', () => {
    expect(validaVoce({ ...buona, valore: undefined }).ok).toBe(true)
    expect(validaVoce({ ...buona, valore: null }).ok).toBe(true)
  })

  it('respinge id, data e tipi sbagliati', () => {
    expect(validaVoce(null).ok).toBe(false)
    expect(validaVoce('riga').ok).toBe(false)
    expect(validaVoce({ ...buona, id: '42' }).ok).toBe(false)
    expect(validaVoce({ ...buona, quando: 'ieri' }).ok).toBe(false)
    expect(validaVoce({ ...buona, soggetto: 3 }).ok).toBe(false)
    expect(validaVoce({ ...buona, valore: 41000 }).ok).toBe(false)
  })
})
