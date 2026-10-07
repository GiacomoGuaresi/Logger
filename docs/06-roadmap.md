# 06 · Roadmap

## Come si procede

Sviluppo a **piccoli incrementi stabili**, come Trekking. Ogni step:

- aggiunge **una sola cosa** utilizzabile;
- è **finito** quando:
  1. i test sono verdi e la build riesce;
  2. c'è un commit sul repository locale;
  3. l'app in locale si può usare davvero, dal Mac e dal telefono, senza pezzi a metà.

Dalla Fase 2 "finito" vuol dire anche pubblicato: il push su `main` passa test e build e va su GitHub Pages. Dopo la 1.0 l'app si usa e basta; uno step nuovo si aggiunge solo quando l'uso mostra che manca qualcosa, prendendo spunto da [02 · Idee per dopo](02-funzionalita.md#idee-per-dopo).

## Fase 0 · Progettazione

- [x] Documentazione di base
- [x] Modello semplificato: righe **soggetto · chiave · valore** con la data, solo diario ([07](07-decisioni.md))
- [x] Prova in locale con SQLite, Supabase nella Fase 2
- [x] Giro di Q&A ([Q&A.md](../Q&A.md)): valgono le scelte proposte (palette grafite e ambra, diario unico)

## Fase 1 · Prova in locale

- [x] **1 · Scheletro locale**: `git init` locale, LICENSE, `.gitignore` (con `dati/`), scaffold Vite + React + TS + Tailwind + Vitest copiato da Trekking senza Supabase, `npm run dev` con `--host`, guscio con intestazione e menu, pagina "Logger" vuota. *Finito anche quando*: si apre dal telefono all'IP del Mac
- [x] **2 · Registrare**: `ArchivioSqlite` su `dati/logger.db`, plugin `/api` per Vite, `ArchivioHttp`, schermata Registra con soggetto, chiave e valore; test di contratto su `:memory:`, test delle rotte e della pulizia dei campi. *Finito anche quando*: una riga scritta dal telefono è in `logger.db`
- [x] **3 · Diario**: righe dalla più recente raggruppate per giorno, "Mostra altre", eliminazione con conferma, suggerimenti di soggetti e chiavi in Registra; test su raggruppamento e suggerimenti
- [x] **4 · Senza rete**: memoria locale e coda adattate da Grocery, segno "da inviare"; test della coda e del reinvio. *Finito anche quando*: con il Wi‑Fi del telefono spento si scrive una riga, e quando torna compare nel database una volta sola, con l'ora in cui era stata scritta
- [x] **5 · Rifinitura**: `npm run prova`, HTTPS locale con mkcert, PWA installabile sul telefono, icona e sfondo; poi **qualche settimana di uso reale**
  - [x] `npm run prova` (build + `vite preview --host`), con l'API servita anche dal preview
  - [x] PWA con `vite-plugin-pwa`: manifest, service worker con la sola shell, `/api` sempre in rete; voce "Installa l'app" nel menu
  - [x] Icona panna e ambra su grafite (prima `gauge`, ora `notebook-pen`) (`npm run icone`), sfondo doodle (prima strada e officina, ora a tema diario) (`npm run sfondo`)
  - [x] HTTPS opzionale con mkcert (tolto con la Fase 2: GitHub Pages è già in HTTPS)
  - [x] Rifinitura dell'uso da telefono: Registra a passi con pulsanti, tastierino numerico e unità; diario a timeline con filtro per chiave
  - ~~Qualche settimana di uso reale in locale~~: si passa subito alla Fase 2, l'uso reale si fa in produzione

## Versione 1.0 · Prima della produzione

- [x] Data scelta in Registra: adesso, Ieri o il selettore del telefono; mai nel futuro
- [x] Modifica di una riga dal diario (chiave, valore, data)
- [x] Eliminare subito, con Annulla al posto della conferma
- [x] Tema generico: icona `notebook-pen`, sfondo a tema diario, descrizione nuova

## Fase 2 · Supabase e GitHub Pages

Come Trekking ([05](05-esecuzione.md#pubblicazione)). Si parte da una tabella vuota: le righe della prova in locale non si copiano.

- [x] Script `supabase/sql/` (schema `logger`, tabella `voci` con RLS, vista `usi`)
- [x] `ArchivioSupabase` con il contratto dell'archivio; test su Supabase locale con `SUPABASE_TEST_*` (da far girare con `supabase start`)
- [x] Passphrase e sessione condivisa con le altre app (`ConAccesso`, `AccessoSupabase`)
- [x] Via il server locale: SQLite, `/api`, `ArchivioHttp`, certificati e dati di prova
- [x] `base: '/Logger/'` e workflow `pubblica.yml`
- [ ] Script SQL applicati sul progetto di produzione, `logger` negli Exposed schemas, redirect di Auth
- [ ] Repository pubblico `GiacomoGuaresi/Logger` con le variabili, Pages attivo, primo deploy
- [ ] Checklist di sicurezza ([04](04-sicurezza.md#checklist-prima-di-pubblicare))
- [ ] Prova da telefono: accesso (o sessione già aperta da un'altra app), installazione, una riga col Wi‑Fi spento che arriva quando torna
