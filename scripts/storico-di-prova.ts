/**
 * Riempie dati/logger.db con un mese di righe inventate per C3 (auto) e
 * Guzzi Breva (moto), per provare diari, card e scelte con dati verosimili.
 * Solo per la prova in locale: queste righe non vanno in produzione.
 *
 * - I km crescono giorno per giorno e finiscono appena sotto l'ultimo "Km"
 *   scritto a mano per quel soggetto, così il diario resta coerente.
 * - Le righe generate hanno id che iniziano con 00000000-0000-4000-8000-:
 *   rilanciando lo script si tolgono quelle vecchie e si riscrivono, senza
 *   toccare le righe scritte dall'app.
 * - Il seed è fisso: a parità di giorno esce sempre lo stesso storico.
 *
 * Uso: npm run storico            →  ultimi 30 giorni, fino a ieri
 *      npm run storico -- 60      →  ultimi 60 giorni
 *      npm run storico -- via     →  toglie solo le righe generate
 */
import { DatabaseSync } from 'node:sqlite'
import { ArchivioSqlite } from '../server/archivioSqlite.ts'
import { validaVoce, type Voce } from '../src/dominio/voce.ts'

const DATABASE = new URL('../dati/logger.db', import.meta.url).pathname
const PREFISSO = '00000000-0000-4000-8000-'

/** Numeri casuali ripetibili (mulberry32). */
function casuale(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const caso = casuale(20261006)
const tra = (min: number, max: number) => min + caso() * (max - min)
const intero = (min: number, max: number) => Math.round(tra(min, max))
const euro = (n: number) => `${n.toFixed(2).replace('.', ',')}€`

interface Evento {
  ora: Date
  chiave: string
  valore: string | null
}

/** Un orario del giorno, ora locale del Mac. */
function alle(giorno: Date, ore: number, minuti: number): Date {
  return new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDate(), ore, minuti)
}
const dopo = (ora: Date, minuti: number) => new Date(ora.getTime() + minuti * 60_000)
const weekend = (giorno: Date) => giorno.getDay() === 0 || giorno.getDay() === 6

/** C3: casa-lavoro nei giorni feriali, qualche gita nel weekend, benzina ogni 550-700 km (serbatoio da 45 litri). */
function auto(giorni: Date[]): { strada: number[]; eventi: (km: number[]) => Evento[] } {
  const strada = giorni.map((g) => (weekend(g) ? (caso() < 0.35 ? intero(90, 180) : intero(0, 30)) : intero(34, 46)))
  const eventi = (km: number[]): Evento[] => {
    const lista: Evento[] = []
    let dalPieno = intero(150, 400)
    let prossimoPieno = intero(550, 700)
    giorni.forEach((g, i) => {
      dalPieno += strada[i]
      const sera = alle(g, intero(18, 19), intero(0, 59))
      if (dalPieno >= prossimoPieno) {
        const litri = Math.min((dalPieno * tra(4.8, 5.8)) / 100, tra(36, 42))
        lista.push({ ora: sera, chiave: 'Km', valore: String(km[i]) })
        lista.push({ ora: dopo(sera, 3), chiave: 'Benzina', valore: euro(litri * tra(1.76, 1.86)) })
        dalPieno = 0
        prossimoPieno = intero(550, 700)
      } else if (g.getDay() === 1 || caso() < 0.12) {
        lista.push({ ora: alle(g, 8, intero(0, 25)), chiave: 'Km', valore: String(km[i] - strada[i]) })
      }
      if (weekend(g) && strada[i] > 90 && caso() < 0.6) lista.push({ ora: alle(g, intero(10, 16), intero(0, 59)), chiave: 'Pedaggio', valore: euro(tra(3.5, 9)) })
      if (i === 11) {
        const mattina = alle(g, 10, intero(0, 30))
        lista.push({ ora: mattina, chiave: 'Controllo Olio', valore: null })
        lista.push({ ora: dopo(mattina, 6), chiave: 'Pressione gomme', valore: '2,4 bar' })
      }
      if (i === giorni.length - 9) lista.push({ ora: alle(g, 11, intero(0, 40)), chiave: 'Lavaggio', valore: euro(12) })
    })
    return lista
  }
  return { strada, eventi }
}

/** Guzzi Breva: giri nel weekend e qualche sera d'estate, benzina ogni 200-250 km (serbatoio da 18 litri). */
function moto(giorni: Date[]): { strada: number[]; eventi: (km: number[]) => Evento[] } {
  const strada = giorni.map((g) => (weekend(g) ? (caso() < 0.7 ? intero(70, 260) : 0) : caso() < 0.1 ? intero(30, 60) : 0))
  const eventi = (km: number[]): Evento[] => {
    const lista: Evento[] = []
    let dalPieno = intero(30, 90)
    let prossimoPieno = intero(200, 250)
    let giri = 0
    giorni.forEach((g, i) => {
      if (strada[i] === 0) return
      giri++
      const partenza = weekend(g) ? alle(g, intero(8, 10), intero(0, 59)) : alle(g, 18, intero(30, 50))
      if (giri === 2 || giri === 7) {
        lista.push({ ora: dopo(partenza, -10), chiave: 'Controllo Olio', valore: giri === 7 ? 'rabbocco 100 ml' : null })
      }
      if (giri === 4) lista.push({ ora: dopo(partenza, -5), chiave: 'Pressione gomme', valore: '2,3 / 2,5 bar' })
      dalPieno += strada[i]
      const ritorno = dopo(partenza, Math.round(strada[i] * tra(1.1, 1.6)))
      if (dalPieno >= prossimoPieno) {
        const litri = Math.min((dalPieno * tra(4.6, 5.4)) / 100, tra(13, 17))
        lista.push({ ora: dopo(ritorno, -20), chiave: 'Benzina', valore: euro(litri * tra(1.8, 1.9)) })
        dalPieno = 0
        prossimoPieno = intero(200, 250)
      }
      lista.push({ ora: ritorno, chiave: 'Km', valore: String(km[i]) })
      if (giri === 5) lista.push({ ora: dopo(ritorno, 30), chiave: 'Lavaggio', valore: null })
    })
    return lista
  }
  return { strada, eventi }
}

/** Il km di arrivo: l'ultimo "Km" scritto a mano per il soggetto, o un valore di ripiego. */
function kmFinali(db: DatabaseSync, soggetto: string, ripiego: number): number {
  const riga = db
    .prepare(`select valore from voci where soggetto = ? and lower(chiave) = 'km' and id not like ? order by quando desc limit 1`)
    .get(soggetto, `${PREFISSO}%`) as { valore: string | null } | undefined
  const km = Number(riga?.valore?.replace(/\D/g, ''))
  return Number.isFinite(km) && km > 0 ? km : ripiego
}

function storico(db: DatabaseSync, soggetto: string, ripiego: number, giorni: Date[], genera: typeof auto): Omit<Voce, 'id'>[] {
  const { strada, eventi } = genera(giorni)
  let km = kmFinali(db, soggetto, ripiego) - strada.reduce((a, b) => a + b, 0)
  const progressivi = strada.map((d) => (km += d))
  return eventi(progressivi).map((e) => ({ quando: e.ora.toISOString(), soggetto, chiave: e.chiave, valore: e.valore }))
}

const argomento = process.argv[2]
const db = new DatabaseSync(DATABASE)
const archivio = new ArchivioSqlite(db)
const tolte = db.prepare('delete from voci where id like ?').run(`${PREFISSO}%`).changes

if (argomento === 'via') {
  console.log(`Tolte ${tolte} righe generate.`)
} else {
  const quanti = Number(argomento ?? 30)
  if (!Number.isInteger(quanti) || quanti < 1 || quanti > 365) throw new Error('Giorni: un numero da 1 a 365')
  const oggi = new Date()
  const giorni = Array.from({ length: quanti }, (_, i) => new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() - quanti + i))

  const righe = [...storico(db, 'C3', 10000, giorni, auto), ...storico(db, 'Guzzi Breva', 41600, giorni, moto)].sort((a, b) =>
    a.quando.localeCompare(b.quando),
  )
  for (const [n, riga] of righe.entries()) {
    const esito = validaVoce({ id: PREFISSO + String(n).padStart(12, '0'), ...riga })
    if (!esito.ok) throw new Error(`${esito.errore}: ${JSON.stringify(riga)}`)
    await archivio.salva(esito.voce)
  }
  const dal = giorni[0].toLocaleDateString('it-IT')
  const al = giorni.at(-1)!.toLocaleDateString('it-IT')
  console.log(`Scritte ${righe.length} righe dal ${dal} al ${al} (tolte ${tolte} generate prima).`)
}
db.close()
