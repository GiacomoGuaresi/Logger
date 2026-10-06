# 06 · Roadmap

## Come si procede

Sviluppo a **piccoli incrementi stabili**, come Trekking. Ogni step:

- aggiunge **una sola cosa** utilizzabile;
- è **finito** quando:
  1. i test sono verdi e la build riesce;
  2. c'è un commit sul repository locale;
  3. l'app in locale si può usare davvero, dal Mac e dal telefono, senza pezzi a metà.

Niente pubblicazione online né pipeline finché dura la prova. Dopo lo step 5 l'app si usa e basta; uno step nuovo si aggiunge solo quando l'uso mostra che manca qualcosa, prendendo spunto da [02 · Idee per dopo](02-funzionalita.md#idee-per-dopo).

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
- [ ] **5 · Rifinitura**: `npm run prova`, HTTPS locale con mkcert, PWA installabile sul telefono, icona e sfondo; poi **qualche settimana di uso reale**
  - [x] `npm run prova` (build + `vite preview --host`), con l'API servita anche dal preview
  - [x] PWA con `vite-plugin-pwa`: manifest, service worker con la sola shell, `/api` sempre in rete; voce "Installa l'app" nel menu
  - [x] Icona panna e ambra su grafite (prima `gauge`, ora `notebook-pen`) (`npm run icone`), sfondo doodle strada e officina (`npm run sfondo`)
  - [x] HTTPS opzionale: `npm run certificati` con mkcert, usato da Vite se il certificato c'è ([05](05-esecuzione.md#https-per-la-pwa))
  - [ ] mkcert installato sul Mac e radice resa attendibile sul telefono
  - [ ] Prova da telefono: installazione, una riga col Wi‑Fi spento che arriva quando torna
  - [ ] Qualche settimana di uso reale

## Fase 2 · Verso Supabase

Solo se la prova regge; da dettagliare allora ([05](05-esecuzione.md#fase-2--pubblicazione-con-supabase)).

- [ ] Schema `logger` e tabella `voci` su Supabase, con RLS
- [ ] `ArchivioSupabase` che passa gli stessi test di contratto
- [ ] Passphrase e sessione condivisa con le altre app
- [ ] Script che copia `logger.db` in Postgres mantenendo id e date
- [ ] Repository pubblico su GitHub, pipeline e GitHub Pages
