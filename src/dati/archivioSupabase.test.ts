// Il contratto dell'archivio contro un Supabase vero, più le policy. Gira solo
// se trova le variabili SUPABASE_TEST_*, pensate per il Supabase locale di
// `supabase start` con gli script di supabase/sql/ applicati: ogni test svuota
// la tabella, quindi mai contro il progetto di produzione. Senza le variabili
// i test si saltano.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { AccessoSupabase } from './accesso'
import { ErroreRifiutato } from './archivio'
import { ArchivioSupabase } from './archivioSupabase'
import { verificaContratto, voce } from './contratto'

const url = process.env.SUPABASE_TEST_URL ?? ''
const chiave = process.env.SUPABASE_TEST_PUBLISHABLE_KEY ?? ''
const segreta = process.env.SUPABASE_TEST_SECRET_KEY ?? ''

const UTENTE = { email: 'test@logger.local', password: 'passphrase-di-prova' }
const OPZIONI = { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'logger' } }

describe.skipIf(!url || !chiave || !segreta)('ArchivioSupabase', () => {
  // La chiave segreta scavalca le policy: serve solo a creare l'account e a
  // svuotare la tabella tra un test e l'altro.
  let admin: SupabaseClient
  let autenticato: SupabaseClient

  beforeAll(async () => {
    admin = createClient(url, segreta, OPZIONI) as unknown as SupabaseClient
    const creato = await admin.auth.admin.createUser({ ...UTENTE, email_confirm: true })
    if (creato.error && creato.error.code !== 'email_exists') throw creato.error

    autenticato = createClient(url, chiave, OPZIONI) as unknown as SupabaseClient
    const accesso = await autenticato.auth.signInWithPassword(UTENTE)
    if (accesso.error) throw accesso.error
  })

  async function svuota(): Promise<void> {
    const { error } = await admin.from('voci').delete().not('id', 'is', null)
    if (error) throw error
  }

  describe('contratto', () => {
    verificaContratto(async () => {
      await svuota()
      return new ArchivioSupabase(autenticato)
    })
  })

  it('i check del database respingono una riga sbagliata, come dati da non riprovare', async () => {
    await svuota()
    await expect(new ArchivioSupabase(autenticato).salva(voce(1, { soggetto: '' }))).rejects.toBeInstanceOf(ErroreRifiutato)
  })

  it('senza sessione non si legge né si scrive niente', async () => {
    await svuota()
    await new ArchivioSupabase(autenticato).salva(voce(1))
    const anonimo = createClient(url, chiave, OPZIONI) as unknown as SupabaseClient
    const righe = await anonimo.from('voci').select('id')
    expect(righe.data ?? []).toEqual([])
    const usi = await anonimo.from('usi').select('*')
    expect(usi.data ?? []).toEqual([])
    await expect(new ArchivioSupabase(anonimo).salva(voce(2))).rejects.toThrow()
  })

  describe('accesso con passphrase', () => {
    const porta = () => new AccessoSupabase(createClient(url, chiave, OPZIONI) as unknown as SupabaseClient, UTENTE.email)

    it('con la passphrase giusta si entra e la sessione resta', async () => {
      const accesso = porta()
      expect(await accesso.entra(UTENTE.password)).toBe('dentro')
      expect(await accesso.haSessione()).toBe(true)
    })

    it('con quella sbagliata no', async () => {
      const accesso = porta()
      expect(await accesso.entra('passphrase-sbagliata')).toBe('passphrase-sbagliata')
      expect(await accesso.haSessione()).toBe(false)
    })
  })
})
