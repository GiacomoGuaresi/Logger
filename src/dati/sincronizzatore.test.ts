import { describe, expect, it } from 'vitest'
import type { Voce } from '../dominio/voce'
import { ErroreRete, ErroreRifiutato, type Archivio, type OpzioniLettura } from './archivio'
import { ArchivioInMemoria } from './archivioInMemoria'
import { idDi, voce } from './contratto'
import { MemoriaLocale, type Scaffale } from './memoriaLocale'
import { Sincronizzatore } from './sincronizzatore'

/** Un archivio in memoria con un interruttore per la rete, e un contatore delle scritture arrivate. */
class ArchivioDiProva implements Archivio {
  readonly sotto = new ArchivioInMemoria()
  rete = true
  arrivate = 0
  /** Gli id che il "server" rifiuta. */
  rifiuta = new Set<string>()

  private controlla() {
    if (!this.rete) throw new ErroreRete()
  }
  async leggi(opzioni: OpzioniLettura) {
    this.controlla()
    return this.sotto.leggi(opzioni)
  }
  async usi() {
    this.controlla()
    return this.sotto.usi()
  }
  async salva(v: Voce) {
    this.controlla()
    if (this.rifiuta.has(v.id)) throw new ErroreRifiutato('La chiave è vuota')
    this.arrivate += 1
    return this.sotto.salva(v)
  }
  async elimina(id: string) {
    this.controlla()
    this.arrivate += 1
    return this.sotto.elimina(id)
  }
}

function scaffale(): Scaffale & { dati: Map<string, string> } {
  const dati = new Map<string, string>()
  return { dati, getItem: (k) => dati.get(k) ?? null, setItem: (k, v) => void dati.set(k, v) }
}

function prepara(archivio = new ArchivioDiProva(), s = scaffale()) {
  return { archivio, scaffale: s, sinc: new Sincronizzatore(archivio, new MemoriaLocale(s)) }
}

/** Gli id del diario aperto, o la sua fase se non è pronto. */
const ids = (sinc: Sincronizzatore) => {
  const stato = sinc.leggi().diario?.stato
  if (!stato) return 'nessun diario'
  return stato.fase === 'pronto' ? stato.voci.map((v) => v.id) : stato.fase
}

const nomi = (sinc: Sincronizzatore) => {
  const { soggetti } = sinc.leggi()
  return soggetti.fase === 'pronto' ? soggetti.elenco.map((s) => [s.nome, s.volte]) : soggetti.fase
}

describe('Sincronizzatore', () => {
  it('alla prima apertura carica, poi mostra un diario per soggetto', async () => {
    const { archivio, sinc } = prepara()
    await archivio.sotto.salva(voce(1))
    await archivio.sotto.salva(voce(2, { soggetto: 'auto' }))
    expect(sinc.leggi().soggetti.fase).toBe('caricamento')
    await sinc.aggiorna()
    expect(nomi(sinc)).toEqual([['auto', 1], ['moto', 1]])
  })

  it('un diario mostra solo le righe del suo soggetto, in tutte le forme scritte', async () => {
    const { archivio, sinc } = prepara()
    await archivio.sotto.salva(voce(1))
    await archivio.sotto.salva(voce(2, { soggetto: 'auto' }))
    await archivio.sotto.salva(voce(3, { soggetto: 'Moto' }))
    await sinc.aggiorna()
    void sinc.apriDiario('MOTO')
    expect(ids(sinc)).toBe('caricamento')
    await sinc.finito()
    expect(ids(sinc)).toEqual([idDi(3), idDi(1)])
    await sinc.apriDiario('auto')
    expect(ids(sinc)).toEqual([idDi(2)])
    sinc.chiudiDiario()
    expect(ids(sinc)).toBe('nessun diario')
  })

  it('senza rete e senza niente in memoria mostra l errore', async () => {
    const { archivio, sinc } = prepara()
    archivio.rete = false
    await sinc.aggiorna()
    expect(sinc.leggi().soggetti).toEqual({ fase: 'errore', messaggio: 'Il server non risponde' })
    expect(sinc.leggi().senzaRete).toBe(true)
  })

  it('con la rete una riga nuova arriva subito, nel suo diario e nella sua card', async () => {
    const { archivio, sinc } = prepara()
    await sinc.aggiorna()
    await sinc.apriDiario('moto')
    sinc.salva(voce(1))
    sinc.salva(voce(2, { soggetto: 'auto' }))
    expect(ids(sinc)).toEqual([idDi(1)])
    expect(nomi(sinc)).toEqual([['auto', 1], ['moto', 1]])
    await sinc.finito()
    expect(await archivio.sotto.leggi({ limite: 10 })).toEqual([voce(2, { soggetto: 'auto' }), voce(1)])
    expect(ids(sinc)).toEqual([idDi(1)])
    expect(sinc.leggi().inAttesa.size).toBe(0)
  })

  it('senza rete la riga va a schermo e in coda, e parte una volta sola quando la rete torna', async () => {
    const { archivio, sinc } = prepara()
    await sinc.aggiorna()
    await sinc.apriDiario('moto')
    archivio.rete = false
    sinc.salva(voce(1))
    sinc.salva(voce(2))
    await sinc.finito()
    expect(ids(sinc)).toEqual([idDi(2), idDi(1)])
    expect([...sinc.leggi().inAttesa]).toEqual([idDi(1), idDi(2)])
    expect(sinc.leggi().senzaRete).toBe(true)

    archivio.rete = true
    await sinc.aggiorna()
    await sinc.aggiorna()
    expect(archivio.arrivate).toBe(2)
    expect(await archivio.sotto.leggi({ limite: 10 })).toEqual([voce(2), voce(1)])
    expect(sinc.leggi().inAttesa.size).toBe(0)
    expect(sinc.leggi().senzaRete).toBe(false)
  })

  it('la coda e i diari sopravvivono alla chiusura dell app', async () => {
    const archivio = new ArchivioDiProva()
    const s = scaffale()
    await archivio.sotto.salva(voce(1))
    const prima = prepara(archivio, s).sinc
    await prima.aggiorna()
    await prima.apriDiario('moto')
    archivio.rete = false
    prima.salva(voce(7))
    await prima.finito()

    // Riaperta ancora senza rete: card e diario dalla memoria, con la riga in coda.
    const dopo = prepara(archivio, s).sinc
    expect(nomi(dopo)).toEqual([['moto', 2]])
    void dopo.apriDiario('moto')
    expect(ids(dopo)).toEqual([idDi(7), idDi(1)])
    await dopo.finito()
    expect(ids(dopo)).toEqual([idDi(7), idDi(1)])

    archivio.rete = true
    await dopo.aggiorna()
    expect(await archivio.sotto.leggi({ limite: 10 })).toEqual([voce(7), voce(1)])
  })

  it('senza rete e mai aperto prima, un diario mostra almeno le righe scritte qui', async () => {
    const { archivio, sinc } = prepara()
    archivio.rete = false
    sinc.salva(voce(1, { soggetto: 'barca' }))
    await sinc.apriDiario('barca')
    expect(ids(sinc)).toEqual([idDi(1)])
  })

  it('eliminare senza rete toglie la riga dallo schermo e la elimina quando la rete torna', async () => {
    const { archivio, sinc } = prepara()
    await archivio.sotto.salva(voce(1))
    await sinc.aggiorna()
    await sinc.apriDiario('moto')
    archivio.rete = false
    sinc.elimina(idDi(1))
    await sinc.finito()
    expect(ids(sinc)).toEqual([])
    archivio.rete = true
    await sinc.aggiorna()
    expect(await archivio.sotto.leggi({ limite: 10 })).toEqual([])
    expect(nomi(sinc)).toEqual([])
  })

  it('una scrittura rifiutata si toglie dalla coda, si segnala e non blocca le altre', async () => {
    const { archivio, sinc } = prepara()
    await sinc.aggiorna()
    archivio.rifiuta.add(idDi(1))
    sinc.salva(voce(1))
    sinc.salva(voce(2))
    await sinc.finito()
    expect(await archivio.sotto.leggi({ limite: 10 })).toEqual([voce(2)])
    expect(sinc.leggi().inAttesa.size).toBe(0)
    expect(sinc.leggi().rifiutata).toBe('La chiave è vuota')
  })

  it('mostraAltre aggiunge la pagina dopo, solo del diario aperto', async () => {
    const { archivio, sinc } = prepara()
    for (let n = 0; n < 102; n++) await archivio.sotto.salva(voce(n, { quando: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString() }))
    await archivio.sotto.salva(voce(500, { soggetto: 'auto' }))
    await sinc.aggiorna()
    await sinc.apriDiario('moto')
    const stato = () => sinc.leggi().diario?.stato as { voci: Voce[]; finite: boolean }
    expect(stato().voci).toHaveLength(100)
    expect(stato().finite).toBe(false)
    await sinc.mostraAltre()
    expect(stato().voci).toHaveLength(102)
    expect(stato().voci.every((v) => v.soggetto === 'moto')).toBe(true)
    expect(stato().finite).toBe(true)
  })

  it('tiene il riepilogo per le scelte: subito con le righe in coda, anche senza rete e dopo la riapertura', async () => {
    const archivio = new ArchivioDiProva()
    const s = scaffale()
    await archivio.sotto.salva(voce(1, { valore: '41000' }))
    const prima = prepara(archivio, s).sinc
    await prima.aggiorna()
    expect(prima.leggi().usi.map((u) => [u.chiave, u.volte])).toEqual([['km', 1]])

    archivio.rete = false
    prima.salva(voce(2, { chiave: 'Benzina', valore: '25€' }))
    await prima.finito()
    expect(prima.leggi().usi.map((u) => u.chiave).sort()).toEqual(['Benzina', 'km'])

    const dopo = prepara(archivio, s).sinc
    expect(dopo.leggi().usi.map((u) => u.chiave).sort()).toEqual(['Benzina', 'km'])
    archivio.rete = true
    await dopo.aggiorna()
    expect(dopo.leggi().usi.map((u) => [u.chiave, u.volte]).sort()).toEqual([['Benzina', 1], ['km', 1]])
  })

  it('dopo un eliminazione il riepilogo si rilegge', async () => {
    const { archivio, sinc } = prepara()
    await archivio.sotto.salva(voce(1, { valore: '41000' }))
    await archivio.sotto.salva(voce(2, { valore: '41200' }))
    await sinc.aggiorna()
    sinc.elimina(idDi(2))
    await sinc.finito()
    expect(sinc.leggi().usi[0]).toMatchObject({ volte: 1, ultimoValore: { valore: '41000' } })
  })

  it('una modifica sostituisce la riga, la riordina per data e non cambia i conti', async () => {
    const { archivio, sinc } = prepara()
    await archivio.sotto.salva(voce(1, { quando: '2026-10-05T08:00:00.000Z', valore: '41000' }))
    await archivio.sotto.salva(voce(2, { quando: '2026-10-06T08:00:00.000Z', valore: '41200' }))
    await sinc.aggiorna()
    await sinc.apriDiario('moto')
    expect(ids(sinc)).toEqual([idDi(2), idDi(1)])

    archivio.rete = false
    // La riga 1 corretta e spostata a dopo la 2.
    sinc.modifica(voce(1, { quando: '2026-10-06T09:00:00.000Z', valore: '41300' }))
    await sinc.finito()
    expect(ids(sinc)).toEqual([idDi(1), idDi(2)])
    expect(sinc.leggi().usi[0].volte).toBe(2)

    archivio.rete = true
    await sinc.aggiorna()
    expect(await archivio.sotto.leggi({ limite: 10 })).toHaveLength(2)
    expect(sinc.leggi().usi[0]).toMatchObject({ volte: 2, ultimoValore: { valore: '41300' } })
  })

  it('Annulla dopo un eliminazione rimette la riga com era, con o senza rete', async () => {
    for (const rete of [true, false]) {
      const { archivio, sinc } = prepara()
      await archivio.sotto.salva(voce(1, { valore: '41000' }))
      await sinc.aggiorna()
      await sinc.apriDiario('moto')
      archivio.rete = rete
      sinc.elimina(idDi(1))
      await sinc.finito()
      expect(ids(sinc)).toEqual([])
      sinc.modifica(voce(1, { valore: '41000' }))
      archivio.rete = true
      await sinc.aggiorna()
      expect(ids(sinc)).toEqual([idDi(1)])
      expect(await archivio.sotto.leggi({ limite: 10 })).toEqual([voce(1, { valore: '41000' })])
      expect(sinc.leggi().usi[0].volte).toBe(1)
    }
  })

  it('ignora una memoria rovinata', () => {
    const s = scaffale()
    s.dati.set('logger.diari', '{non json')
    s.dati.set('logger.usi', JSON.stringify([{ soggetto: 'moto' }, 7]))
    s.dati.set('logger.coda', JSON.stringify([{ tipo: 'salva', voce: { id: 'x' } }, { tipo: 'elimina', id: idDi(1) }, 42]))
    const memoria = new MemoriaLocale(s)
    expect(memoria.leggiDiario('moto')).toBeNull()
    expect(memoria.leggiUsi()).toEqual([])
    expect(memoria.leggiCoda()).toEqual([{ tipo: 'elimina', id: idDi(1) }])
  })
})
