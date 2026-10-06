# 07 · Decisioni

| Data | Decisione | Esito |
|---|---|---|
| 2026-10-05 | Nuova app di casa chiamata **Logger**, repository pubblico, licenza **MIT** | deciso |
| 2026-10-05 | **Stessa struttura, tecnologia e database** di Grocery, Projects e Trekking | deciso |
| 2026-10-05 | Hosting **GitHub Pages** su `giacomoguaresi.github.io/Logger` | rimandato alla Fase 2 |
| 2026-10-05 | **Progetto Supabase di produzione di Grocery**, schema dedicato `logger`, script SQL numerati applicati a mano | rimandato alla Fase 2 |
| 2026-10-05 | Accesso con **lo stesso account e la sola passphrase**, sessione condivisa con le altre app | rimandato alla Fase 2 |
| 2026-10-05 | ~~Soggetti e tipi di evento definiti dall'app, con campi e valori in `jsonb`~~ | superata il 2026-10-06 |
| 2026-10-05 | ~~Prima versione con registrazione per tipo e cronologia per soggetto~~ | superata il 2026-10-06 |
| 2026-10-05 | **Funziona senza rete**: cache e coda in `localStorage` come Grocery, **id generati dal browser**, reinvio idempotente | deciso, allo step 4 |
| 2026-10-06 | **App minima** che cresce solo quando l'uso mostra cosa manca | deciso |
| 2026-10-06 | Ogni registrazione è una riga **soggetto · chiave · valore** con la data; il valore è **testo libero e facoltativo** (senza valore la riga è un semplice segno "fatto") | deciso |
| 2026-10-06 | **Una sola tabella**: niente tabelle di soggetti o chiavi, nascono la prima volta che si scrivono; i suggerimenti si calcolano dalle righe | deciso |
| 2026-10-06 | Soggetti e chiavi confrontati **senza maiuscole e minuscole** | deciso |
| 2026-10-06 | Lettura: **solo il diario**, dalla riga più recente, con eliminazione per correggere gli errori | deciso |
| 2026-10-06 | La data è quella del momento in cui si scrive, **non modificabile** per ora | deciso |
| 2026-10-06 | **Prova in locale** prima di pubblicare: si vede se il progetto regge, poi si migra a Supabase | deciso |
| 2026-10-06 | Database **SQLite sul Mac** (`dati/logger.db`), con `node:sqlite` di Node 24: nessuna dipendenza nativa | deciso |
| 2026-10-06 | Un **piccolo server** dentro Vite (plugin `/api`), così Mac e telefono sulla stessa rete vedono gli stessi dati; scartato SQLite nel browser, che avrebbe tenuto dati separati per dispositivo | deciso |
| 2026-10-06 | Interfaccia **`Archivio`** con test di contratto, come lo `Storage` di Grocery: SQLite oggi, Supabase domani senza toccare l'app | deciso |
| 2026-10-06 | **Niente pipeline né pubblicazione online** durante la prova; git **solo locale** | deciso |
| 2026-10-06 | **Niente passphrase** durante la prova: il server è raggiungibile solo dalla rete di casa | deciso |
| 2026-10-06 | Restano la **coda senza rete** (step 4) e la **PWA** (step 5, con HTTPS locale via mkcert) | deciso |
| 2026-10-06 | Colore **grafite** con accento **ambra**, icona Lucide `gauge` | proposto, vedi [Q&A](../Q&A.md) |
