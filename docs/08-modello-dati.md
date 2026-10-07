# 08 · Modello dati

Una sola tabella, **`logger.voci`**: una riga per ogni cosa registrata. Sta in **Postgres** su Supabase, nello schema `logger` del progetto di Grocery, creata dagli script di `supabase/sql/` ([05](05-esecuzione.md#supabase-una-volta)). Accanto, una vista **`logger.usi`** con il riepilogo per soggetto · chiave.

> Durante la prova in locale (Fase 1) le stesse colonne stavano in SQLite sul Mac. In produzione si è partiti da una tabella vuota: le righe della prova erano solo di prova ([07](07-decisioni.md)).

## `voci`

| Colonna | Tipo | Vincoli e note |
|---|---|---|
| `id` | `uuid primary key` | **generato dal browser** (`crypto.randomUUID()`), così una scrittura in coda si può rimandare senza doppioni ([03](03-architettura.md#senza-rete)) |
| `quando` | `timestamptz not null` | quando è successo: di solito l'ora in cui si scrive, oppure una data scelta a mano (mai nel futuro); l'app lo tiene come ISO 8601 UTC (`2026-10-06T08:12:00.000Z`) |
| `soggetto` | `text not null` | non vuoto, senza spazi in testa o in coda, al massimo 50 caratteri (`check`) |
| `chiave` | `text not null` | stesse regole del soggetto |
| `valore` | `text` | facoltativo: vuoto diventa `null`; al massimo 200 caratteri |
| `creato_il` | `timestamptz not null default now()` | quando la riga è arrivata all'archivio |

Indici su `(soggetto, quando desc, id desc)` per il diario di un soggetto e su `(quando desc, id desc)`. RLS attiva: solo la sessione aperta con la passphrase legge e scrive ([04](04-sicurezza.md)).

Le regole su soggetto, chiave e valore si applicano **due volte**: nel browser prima di salvare (`src/dominio/voce.ts`) e nel database con i `check`. Una riga che il database rifiuta è un errore "rifiutato": la coda la toglie e la segnala ([03](03-architettura.md#archivio-sostituibile)).

Una **modifica** dal diario riscrive la riga con lo stesso `id` (upsert): cambiano chiave, valore o `quando`, mai il soggetto.

Esempi:

| quando | soggetto | chiave | valore |
|---|---|---|---|
| 2026-10-06 08:12 | moto | km | 41000 |
| 2026-10-06 08:13 | moto | Benzina | 25€ |
| 2026-10-06 18:40 | auto | Controllo olio | `null` |

## `usi`

Vista con `security_invoker = true`, quindi con le stesse policy di `voci`: senza sessione è vuota. Una riga per coppia soggetto · chiave **scritta esattamente così**:

| Colonna | Cosa contiene |
|---|---|
| `soggetto`, `chiave` | la coppia |
| `volte` | quante righe |
| `ultima_volta` | il `quando` più recente |
| `ultimo_valore`, `ultimo_valore_quando` | l'ultimo valore non vuoto e la sua data, `null` se la coppia non ne ha mai avuti |

Da qui vengono le scelte di Registra, l'ultimo valore, le card dei diari e il conto delle chiavi nel filtro. Il raggruppamento senza maiuscole e accenti ("moto" e "Moto") si fa nel browser (`src/dominio/suggerimenti.ts`).

## Perché così

- **Niente tabelle di soggetti o chiavi**: un soggetto o una chiave nuovi nascono scrivendoli. Le scelte e l'ultimo valore si ricavano dalle righe, con la vista `usi`.
- **Il valore è testo**: "25€" e "rabbocco mezzo litro" vanno bene così come sono. L'app riconosce i numeri con un'unità breve per aprire il tastierino e aggiungere l'unità ([02](02-funzionalita.md#registra)), ma nel database resta testo. Se in futuro servono calcoli (km percorsi, spesa), si leggeranno i numeri dal testo o si aggiungerà una colonna: le righe vecchie restano valide.
