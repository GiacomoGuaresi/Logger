# 05 · Esecuzione e manutenzione

## Oggi · in locale sul Mac

Serve **Node 24** (`node:sqlite`). Nessuna variabile d'ambiente, nessun servizio esterno.

| Comando | A cosa serve |
|---|---|
| `npm run dev` | sviluppo: `vite --host`, app e `/api` con ricaricamento a caldo |
| `npm run prova` | uso di tutti i giorni: build e `vite preview --host`, senza ricaricamenti |
| `npm test` | Vitest |
| `npm run build` | controllo dei tipi e build |

- **Dal telefono**: stessa rete Wi‑Fi del Mac, indirizzo `http://<IP del Mac>:<porta>/`, stampato da Vite alla voce *Network*. Conviene dare al Mac un IP fisso sul router, così il segnalibro sul telefono non cambia.
- Il Mac deve essere **acceso e con il server avviato** quando si scrive; se non lo è, dallo step 4 le righe restano in coda sul telefono finché l'app è aperta.

### Database

- File: `dati/logger.db`, creato al primo avvio, **escluso da git**.
- **Backup**: copiare il file con il server fermo (o con `sqlite3 dati/logger.db ".backup copia.db"` anche a server avviato).
- Per guardarci dentro: `sqlite3 dati/logger.db 'select * from voci order by quando desc limit 20'`.

### HTTPS per la PWA

Il service worker, e quindi l'installazione sulla Home e la shell senza rete, funziona solo in **HTTPS** (fa eccezione `localhost`, che vale solo sul Mac). Allo step 5:

1. installare [mkcert](https://github.com/FiloSottile/mkcert) sul Mac e creare la sua autorità locale (`mkcert -install`);
2. generare il certificato per l'IP del Mac e passarlo a Vite (`server.https` e `preview.https`, oppure `vite-plugin-mkcert`);
3. installare sul telefono la radice di mkcert (`mkcert -CAROOT` → `rootCA.pem`) e renderla attendibile (su iOS: Impostazioni → Generali → Info → Impostazioni attendibilità certificati).

Finché non c'è, l'app sul telefono si apre dal browser come una pagina normale.

### Versioni

`git init` **solo locale**: nessun repository remoto, nessuna pipeline, nessuna pubblicazione.

## Fase 2 · Pubblicazione con Supabase

Da dettagliare quando la prova regge. In breve, come Trekking:

- **Repository** pubblico `github.com/GiacomoGuaresi/Logger`, licenza MIT, branch `main` (prima di pubblicarlo: controllare che la storia non contenga `logger.db`).
- **GitHub Pages** su `https://giacomoguaresi.github.io/Logger/`, Vite con `base: '/Logger/'`, workflow `.github/workflows/pubblica.yml` (`npm ci`, controllo variabili, `npm test`, `npm run build`, deploy).
- **Variabili** del repository: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_EMAIL`, stessi valori delle altre app ([04](04-sicurezza.md#dalla-fase-2--supabase)).
- **Supabase**, progetto di produzione di Grocery:
  1. eseguire gli script di `supabase/sql/` in ordine dalla cartella di Grocery: `supabase db query --linked -f ../Logger/supabase/sql/NNN_*.sql`;
  2. aggiungere `logger` agli *Exposed schemas* (Management API `PATCH /v1/projects/{ref}/postgrest`, lista **sempre intera**: `public,graphql_public,projects,trekking,logger`);
  3. aggiungere `https://giacomoguaresi.github.io/Logger/` agli URL di redirect di Auth (`uri_allow_list`, anche questa intera);
  4. copiare le righe da `logger.db` ([08](08-modello-dati.md#passaggio-a-supabase)).
- Il token della Management API sta in `credenziali.local` nella cartella sopra i repository, mai nel repo.

⚠️ Il progetto Supabase è quello di produzione di Grocery: ogni modifica alla configurazione va fatta senza toccare le impostazioni usate dalle altre app.
