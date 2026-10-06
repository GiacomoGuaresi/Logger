import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { ErroreRete, ErroreRifiutato } from '../src/dati/archivio'
import { ArchivioHttp } from '../src/dati/archivioHttp'
import { idDi, verificaContratto, voce } from '../src/dati/contratto'
import { ArchivioSqlite } from './archivioSqlite'
import { gestisci } from './rotte'

function nuovoSqlite() {
  return new ArchivioSqlite(new DatabaseSync(':memory:'))
}

/** Un fetch finto che passa la richiesta alle rotte, senza rete. */
function fetchSu(archivio: ArchivioSqlite): typeof fetch {
  return async (indirizzo, init) => {
    const { stato, corpo } = await gestisci(archivio, {
      metodo: init?.method ?? 'GET',
      url: String(indirizzo),
      corpo: typeof init?.body === 'string' ? init.body : undefined,
    })
    return new Response(corpo === undefined ? null : JSON.stringify(corpo), { status: stato })
  }
}

// Tutta la catena del browser: ArchivioHttp → rotte → SQLite.
verificaContratto(async () => new ArchivioHttp('/api', fetchSu(nuovoSqlite())))

describe('rotte dell API', () => {
  it('salva con PUT e rilegge con GET', async () => {
    const archivio = nuovoSqlite()
    const salvata = await gestisci(archivio, { metodo: 'PUT', url: `/api/voci/${idDi(1)}`, corpo: JSON.stringify(voce(1)) })
    expect(salvata).toEqual({ stato: 200, corpo: voce(1) })
    expect(await gestisci(archivio, { metodo: 'GET', url: '/api/voci' })).toEqual({ stato: 200, corpo: [voce(1)] })
  })

  it('ripulisce la riga prima di salvarla', async () => {
    const archivio = nuovoSqlite()
    const sporca = { ...voce(1), soggetto: '  moto ', valore: '   ' }
    const { corpo } = await gestisci(archivio, { metodo: 'PUT', url: `/api/voci/${idDi(1)}`, corpo: JSON.stringify(sporca) })
    expect(corpo).toEqual({ ...voce(1), valore: null })
  })

  it('respinge con 400 una riga non valida, senza salvarla', async () => {
    const archivio = nuovoSqlite()
    const risposta = await gestisci(archivio, {
      metodo: 'PUT',
      url: `/api/voci/${idDi(1)}`,
      corpo: JSON.stringify({ ...voce(1), chiave: '' }),
    })
    expect(risposta).toEqual({ stato: 400, corpo: { errore: 'La chiave è vuota' } })
    expect(await archivio.leggi({ limite: 10 })).toEqual([])
  })

  it('respinge un corpo che non è JSON e un id diverso da quello dell indirizzo', async () => {
    const archivio = nuovoSqlite()
    expect((await gestisci(archivio, { metodo: 'PUT', url: `/api/voci/${idDi(1)}`, corpo: '{' })).stato).toBe(400)
    expect(
      (await gestisci(archivio, { metodo: 'PUT', url: `/api/voci/${idDi(2)}`, corpo: JSON.stringify(voce(1)) })).stato,
    ).toBe(400)
  })

  it('controlla limite e prima', async () => {
    const archivio = nuovoSqlite()
    expect((await gestisci(archivio, { metodo: 'GET', url: '/api/voci?limite=0' })).stato).toBe(400)
    expect((await gestisci(archivio, { metodo: 'GET', url: '/api/voci?limite=501' })).stato).toBe(400)
    expect((await gestisci(archivio, { metodo: 'GET', url: '/api/voci?prima=ieri' })).stato).toBe(400)
    expect((await gestisci(archivio, { metodo: 'GET', url: '/api/voci?limite=5&prima=2026-10-06T08:00:00Z' })).stato).toBe(200)
  })

  it('risponde 404 alle rotte sconosciute e 405 ai metodi non ammessi', async () => {
    const archivio = nuovoSqlite()
    expect((await gestisci(archivio, { metodo: 'GET', url: '/api/altro' })).stato).toBe(404)
    expect((await gestisci(archivio, { metodo: 'POST', url: '/api/voci' })).stato).toBe(405)
    expect((await gestisci(archivio, { metodo: 'GET', url: `/api/voci/${idDi(1)}` })).stato).toBe(405)
  })
})

describe('ArchivioHttp, quando le cose vanno male', () => {
  it('senza server lancia ErroreRete', async () => {
    const archivio = new ArchivioHttp('/api', async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(archivio.leggi({ limite: 10 })).rejects.toBeInstanceOf(ErroreRete)
  })

  it('con un 5xx lancia ErroreRete, con un 4xx ErroreRifiutato con il messaggio del server', async () => {
    const con = (stato: number) =>
      new ArchivioHttp('/api', async () => new Response(JSON.stringify({ errore: 'no' }), { status: stato }))
    await expect(con(500).salva(voce(1))).rejects.toBeInstanceOf(ErroreRete)
    await expect(con(400).salva(voce(1))).rejects.toEqual(new ErroreRifiutato('no'))
  })
})
