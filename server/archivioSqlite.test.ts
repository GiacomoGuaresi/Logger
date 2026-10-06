import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { verificaContratto, voce } from '../src/dati/contratto'
import { ArchivioSqlite } from './archivioSqlite'

verificaContratto(async () => new ArchivioSqlite(new DatabaseSync(':memory:')))

describe('ArchivioSqlite', () => {
  it('i check del database respingono un soggetto vuoto anche se la validazione è stata saltata', async () => {
    const archivio = new ArchivioSqlite(new DatabaseSync(':memory:'))
    await expect(archivio.salva(voce(1, { soggetto: '' }))).rejects.toThrow()
  })
})
