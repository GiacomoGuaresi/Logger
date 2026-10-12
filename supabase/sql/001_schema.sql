-- Logger · 001 · Schema vuoto (docs/03-architettura.md, docs/04-sicurezza.md).
--
-- Gira sul progetto Supabase di produzione di Grocery, in uno schema dedicato:
-- nessuna tabella di Grocery (public), Projects (projects) o Adventures
-- (adventures) viene toccata. Si applica a mano, dalla cartella di Grocery già
-- collegata, non con `supabase db push`, che andrebbe in conflitto con lo
-- storico migrazioni di Grocery:
--   supabase db query --linked -f ../Logger/supabase/sql/001_schema.sql
--
-- Dopo averlo eseguito: aggiungere `logger` agli Exposed schemas
-- (docs/05-esecuzione.md, Fase 2). Rilanciabile.

create schema if not exists logger;

-- Permessi ----------------------------------------------------------------------
-- Solo la sessione aperta con la passphrase (ruolo authenticated) usa lo schema.

revoke all on schema logger from public, anon;
grant usage on schema logger to authenticated;
