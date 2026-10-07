-- Logger · 003 · Il riepilogo per le scelte di Registra e le card dei diari
-- (docs/03-architettura.md, docs/08-modello-dati.md).
--
-- Una riga per coppia soggetto · chiave scritta esattamente così, con quante
-- volte, l'ultima volta e l'ultimo valore non vuoto con la sua data. Il
-- raggruppamento senza maiuscole e accenti lo fa il browser
-- (src/dominio/suggerimenti.ts). Con `security_invoker` la vista rispetta le
-- policy di logger.voci: senza sessione non restituisce niente.
--   supabase db query --linked -f ../Logger/supabase/sql/003_usi.sql
-- Rilanciabile.

create or replace view logger.usi
with (security_invoker = true)
as
select
  g.soggetto,
  g.chiave,
  g.volte,
  g.ultima_volta,
  u.valore as ultimo_valore,
  u.quando as ultimo_valore_quando
from (
  select soggetto, chiave, count(*)::int as volte, max(quando) as ultima_volta
  from logger.voci
  group by soggetto, chiave
) g
left join lateral (
  select v.valore, v.quando
  from logger.voci v
  where v.soggetto = g.soggetto and v.chiave = g.chiave and v.valore is not null
  order by v.quando desc, v.id desc
  limit 1
) u on true;

-- I privilegi di default di Supabase darebbero ad authenticated anche le
-- scritture: la vista si legge e basta.
revoke all on logger.usi from public, anon, authenticated;
grant select on logger.usi to authenticated;
