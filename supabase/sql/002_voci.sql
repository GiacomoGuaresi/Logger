-- Logger · 002 · La tabella delle righe (docs/08-modello-dati.md).
--
-- Una riga per ogni cosa registrata: soggetto · chiave · valore, con la data.
-- L'id lo genera il browser, così una scrittura in coda si può rimandare
-- senza doppioni (upsert per id). Le regole sono le stesse di
-- src/dominio/voce.ts: qui fanno da ultima difesa.
--   supabase db query --linked -f ../Logger/supabase/sql/002_voci.sql
-- Rilanciabile.

create table if not exists logger.voci (
  id        uuid primary key,
  quando    timestamptz not null,
  soggetto  text not null check (char_length(soggetto) between 1 and 50 and soggetto = btrim(soggetto)),
  chiave    text not null check (char_length(chiave) between 1 and 50 and chiave = btrim(chiave)),
  valore    text check (valore is null or char_length(valore) between 1 and 200),
  creato_il timestamptz not null default now()
);

-- Il diario di un soggetto, dalla riga più recente, una pagina alla volta.
create index if not exists voci_soggetto_quando on logger.voci (soggetto, quando desc, id desc);
create index if not exists voci_quando on logger.voci (quando desc, id desc);

-- Permessi ----------------------------------------------------------------------
-- Come nelle altre app: solo la sessione aperta con la passphrase, mai `anon`
-- (docs/04-sicurezza.md).

alter table logger.voci enable row level security;

revoke all on logger.voci from public, anon;
grant select, insert, update, delete on logger.voci to authenticated;

drop policy if exists voci_authenticated on logger.voci;
create policy voci_authenticated on logger.voci
  for all to authenticated
  using (true)
  with check (true);
