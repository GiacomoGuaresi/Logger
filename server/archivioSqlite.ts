// L'archivio della prova in locale: SQLite sul Mac, con `node:sqlite` di Node 24
// (docs/03-architettura.md). Stesse colonne della tabella Postgres della Fase 2
// (docs/08-modello-dati.md), così il passaggio è una copia.

import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { Archivio, OpzioniLettura } from '../src/dati/archivio'
import type { Voce } from '../src/dominio/voce'

const SCHEMA = `
create table if not exists voci (
  id        text primary key,
  quando    text not null,
  soggetto  text not null check (length(soggetto) between 1 and 50 and soggetto = trim(soggetto)),
  chiave    text not null check (length(chiave) between 1 and 50 and chiave = trim(chiave)),
  valore    text check (valore is null or length(valore) between 1 and 200),
  creato_il text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index if not exists voci_quando on voci (quando desc);
`

export class ArchivioSqlite implements Archivio {
  constructor(private readonly db: DatabaseSync) {
    db.exec(SCHEMA)
  }

  /** Apre (o crea) il file del database, con la sua cartella. */
  static apri(percorso: string): ArchivioSqlite {
    mkdirSync(dirname(percorso), { recursive: true })
    return new ArchivioSqlite(new DatabaseSync(percorso))
  }

  async leggi({ prima, limite }: OpzioniLettura): Promise<Voce[]> {
    // `quando` è ISO UTC con i millisecondi: come testo si ordina bene.
    const righe = prima
      ? this.db
          .prepare('select id, quando, soggetto, chiave, valore from voci where quando < ? order by quando desc, id desc limit ?')
          .all(prima, limite)
      : this.db.prepare('select id, quando, soggetto, chiave, valore from voci order by quando desc, id desc limit ?').all(limite)
    return righe.map((r) => ({
      id: String(r.id),
      quando: String(r.quando),
      soggetto: String(r.soggetto),
      chiave: String(r.chiave),
      valore: r.valore === null ? null : String(r.valore),
    }))
  }

  async salva(voce: Voce): Promise<void> {
    this.db
      .prepare(
        `insert into voci (id, quando, soggetto, chiave, valore) values (?, ?, ?, ?, ?)
         on conflict (id) do update set
           quando = excluded.quando, soggetto = excluded.soggetto,
           chiave = excluded.chiave, valore = excluded.valore`,
      )
      .run(voce.id, voce.quando, voce.soggetto, voce.chiave, voce.valore)
  }

  async elimina(id: string): Promise<void> {
    this.db.prepare('delete from voci where id = ?').run(id)
  }
}
