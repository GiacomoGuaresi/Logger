# 08 · Modello dati

Una sola tabella, **`voci`**: una riga per ogni cosa registrata. Durante la prova sta in **SQLite** (`dati/logger.db`), creata all'avvio del server se manca; nella Fase 2 passa in **Postgres** su Supabase, nello schema `logger`, con le stesse colonne.

## `voci`

| Colonna | SQLite (oggi) | Postgres (Fase 2) | Vincoli e note |
|---|---|---|---|
| `id` | `text primary key` | `uuid primary key` | **generato dal browser** (`crypto.randomUUID()`), così una scrittura in coda si può rimandare senza doppioni ([03](03-architettura.md#senza-rete)) |
| `quando` | `text not null` | `timestamptz not null` | l'ora in cui la riga è stata scritta, mandata dal browser; in SQLite come ISO 8601 UTC (`2026-10-06T08:12:00.000Z`), che si ordina bene anche come testo |
| `soggetto` | `text not null` | `text not null` | non vuoto, senza spazi in testa o in coda, al massimo 50 caratteri (`check`) |
| `chiave` | `text not null` | `text not null` | stesse regole del soggetto |
| `valore` | `text` | `text` | facoltativo: vuoto diventa `null`; al massimo 200 caratteri |
| `creato_il` | `text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))` | `timestamptz not null default now()` | quando la riga è arrivata all'archivio |

Indice su `quando desc` per il diario.

Le regole su soggetto, chiave e valore si applicano **tre volte**: nel browser prima di salvare (`src/dominio/`), nel server prima di scrivere (stessa funzione) e nel database con i `check`.

Esempi:

| quando | soggetto | chiave | valore |
|---|---|---|---|
| 2026-10-06 08:12 | moto | km | 41000 |
| 2026-10-06 08:13 | moto | Benzina | 25€ |
| 2026-10-06 18:40 | auto | Controllo olio | `null` |

## Perché così

- **Niente tabelle di soggetti o chiavi**: un soggetto o una chiave nuovi nascono scrivendoli. Le scelte e l'ultimo valore si ricavano dalle righe, con un riepilogo per soggetto · chiave ([03](03-architettura.md#come-funziona)); nella Fase 2 diventerà una vista o una funzione in Postgres.
- **Il valore è testo**: "25€" e "rabbocco mezzo litro" vanno bene così come sono. Se in futuro servono calcoli (km percorsi, spesa), si leggeranno i numeri dal testo o si aggiungerà una colonna: le righe vecchie restano valide.
- **Stesse colonne in SQLite e Postgres**: il passaggio è una copia, non una conversione.

## Passaggio a Supabase

Nella Fase 2, una volta creata la tabella `logger.voci` con lo script `supabase/sql/`:

1. si ferma il server locale e si fa un backup di `logger.db`;
2. uno script legge tutte le righe da SQLite e le scrive in Postgres **con lo stesso `id`, `quando` e `creato_il`** (upsert per `id`, quindi si può rilanciare);
3. si confrontano i conteggi, e si passa l'app su `ArchivioSupabase` ([03](03-architettura.md#archivio-sostituibile)).
