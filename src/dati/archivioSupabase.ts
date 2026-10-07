// L'archivio su Supabase (docs/03-architettura.md#archivio-sostituibile): la
// tabella `logger.voci` e la vista `logger.usi` (supabase/sql/), protette dalle
// policy che vogliono la sessione aperta con la passphrase.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Uso } from '../dominio/suggerimenti'
import type { Voce } from '../dominio/voce'
import { ErroreRete, ErroreRifiutato, type Archivio, type OpzioniLettura } from './archivio'

interface ErrorePostgrest {
  message: string
  code?: string
}

/**
 * Riprovare serve solo se il problema non sono i dati. I dati sbagliati hanno
 * codici SQLSTATE di classe 22 (valore non valido) o 23 (vincolo violato): la
 * scrittura si lascia perdere. Tutto il resto (rete assente, sessione scaduta,
 * server giù) è `ErroreRete`: la scrittura resta in coda e riparte dopo.
 */
function errore(cosa: string, e: ErrorePostgrest): Error {
  console.error(cosa, e)
  if (e.code && /^2[23]/.test(e.code)) return new ErroreRifiutato(`${cosa}: ${e.message}`)
  return new ErroreRete(`${cosa}: ${e.message}`)
}

/** Postgres restituisce `2026-10-06T08:12:00+00:00`: l'app vuole sempre ISO UTC coi millisecondi. */
const iso = (quando: string) => new Date(quando).toISOString()

interface RigaUso {
  soggetto: string
  chiave: string
  volte: number
  ultima_volta: string
  ultimo_valore: string | null
  ultimo_valore_quando: string | null
}

export class ArchivioSupabase implements Archivio {
  constructor(private readonly client: SupabaseClient) {}

  async leggi({ soggetti, prima, limite }: OpzioniLettura): Promise<Voce[]> {
    if (soggetti?.length === 0) return []
    let query = this.client.from('voci').select('id, quando, soggetto, chiave, valore')
    if (soggetti) query = query.in('soggetto', soggetti)
    if (prima) query = query.lt('quando', prima)
    const { data, error } = await query
      .order('quando', { ascending: false })
      .order('id', { ascending: false })
      .limit(limite)
    if (error) throw errore('Lettura delle righe', error)
    return (data as Voce[]).map((v) => ({ ...v, quando: iso(v.quando) }))
  }

  async usi(): Promise<Uso[]> {
    const { data, error } = await this.client.from('usi').select('*')
    if (error) throw errore('Lettura del riepilogo', error)
    return (data as RigaUso[]).map((u) => ({
      soggetto: u.soggetto,
      chiave: u.chiave,
      volte: u.volte,
      ultimaVolta: iso(u.ultima_volta),
      ultimoValore:
        u.ultimo_valore !== null && u.ultimo_valore_quando !== null
          ? { valore: u.ultimo_valore, quando: iso(u.ultimo_valore_quando) }
          : null,
    }))
  }

  async salva(voce: Voce): Promise<void> {
    const { id, quando, soggetto, chiave, valore } = voce
    const { error } = await this.client.from('voci').upsert({ id, quando, soggetto, chiave, valore }, { onConflict: 'id' })
    if (error) throw errore('Salvataggio della riga', error)
  }

  async elimina(id: string): Promise<void> {
    const { error } = await this.client.from('voci').delete().eq('id', id)
    if (error) throw errore('Eliminazione della riga', error)
  }
}
