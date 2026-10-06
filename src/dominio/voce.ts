// La riga del diario (docs/08-modello-dati.md): soggetto · chiave · valore, con
// la data. Le stesse regole valgono nel browser prima di salvare, nel server
// prima di scrivere e, con i `check`, nel database.

export interface Voce {
  /** Uuid generato dal browser: rimandare la stessa riga non crea doppioni. */
  id: string
  /** L'ora in cui la riga è stata scritta, ISO 8601 UTC. */
  quando: string
  soggetto: string
  chiave: string
  /** Facoltativo: senza valore la riga dice solo che la cosa è stata fatta. */
  valore: string | null
}

/** I campi che scrive chi usa l'app; id e data li mette l'app. */
export interface CampiVoce {
  soggetto: string
  chiave: string
  valore: string
}

export const LIMITI = { soggetto: 50, chiave: 50, valore: 200 } as const

export type Esito<T> = { ok: true; voce: T } | { ok: false; errore: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Spazi in testa e in coda via, quelli in mezzo ridotti a uno solo. */
export function pulisci(testo: string): string {
  return testo.trim().replace(/\s+/g, ' ')
}

function controllaTesto(nome: 'soggetto' | 'chiave', testo: unknown): string | { errore: string } {
  const etichetta = nome === 'soggetto' ? 'Il soggetto' : 'La chiave'
  if (typeof testo !== 'string') return { errore: `${etichetta} manca` }
  const pulito = pulisci(testo)
  if (pulito === '') return { errore: `${etichetta} è vuot${nome === 'soggetto' ? 'o' : 'a'}` }
  if (pulito.length > LIMITI[nome]) return { errore: `${etichetta} è troppo lung${nome === 'soggetto' ? 'o' : 'a'} (massimo ${LIMITI[nome]} caratteri)` }
  return pulito
}

/**
 * Controlla e ripulisce una riga arrivata da fuori (dal modulo o dalla rete).
 * Il valore vuoto diventa `null`; la data si riscrive in ISO UTC.
 */
export function validaVoce(dati: unknown): Esito<Voce> {
  if (typeof dati !== 'object' || dati === null) return { ok: false, errore: 'Riga non valida' }
  const { id, quando, soggetto, chiave, valore } = dati as Record<string, unknown>

  if (typeof id !== 'string' || !UUID.test(id)) return { ok: false, errore: 'Identificativo non valido' }
  if (typeof quando !== 'string' || Number.isNaN(Date.parse(quando))) return { ok: false, errore: 'Data non valida' }

  const s = controllaTesto('soggetto', soggetto)
  if (typeof s !== 'string') return { ok: false, errore: s.errore }
  const c = controllaTesto('chiave', chiave)
  if (typeof c !== 'string') return { ok: false, errore: c.errore }

  if (valore !== null && valore !== undefined && typeof valore !== 'string') return { ok: false, errore: 'Valore non valido' }
  const v = typeof valore === 'string' ? pulisci(valore) : ''
  if (v.length > LIMITI.valore) return { ok: false, errore: `Il valore è troppo lungo (massimo ${LIMITI.valore} caratteri)` }

  return {
    ok: true,
    voce: { id: id.toLowerCase(), quando: new Date(quando).toISOString(), soggetto: s, chiave: c, valore: v === '' ? null : v },
  }
}

/** Quanto avanti si tollera una data scelta a mano: il minuto del campo arrotonda. */
const TOLLERANZA_FUTURO_MS = 60_000

/**
 * Una riga dal modulo (Registra, o la modifica dal diario): di solito con l'ora
 * di adesso e un id nuovo. Una data scelta a mano non può stare nel futuro: lo
 * si controlla solo qui, con l'orologio di chi scrive, e non in `validaVoce`,
 * perché il server o un orologio un po' avanti non scartino righe già in coda.
 */
export function nuovaVoce(
  campi: CampiVoce,
  ora: Date = new Date(),
  id: string = crypto.randomUUID(),
  adesso: Date = new Date(),
): Esito<Voce> {
  if (Number.isNaN(ora.getTime())) return { ok: false, errore: 'Data non valida' }
  if (ora.getTime() > adesso.getTime() + TOLLERANZA_FUTURO_MS) return { ok: false, errore: 'La data è nel futuro' }
  return validaVoce({ id, quando: ora.toISOString(), ...campi })
}
