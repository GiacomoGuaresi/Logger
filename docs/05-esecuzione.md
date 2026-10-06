# 05 · Esecuzione e manutenzione

## Oggi · in locale sul Mac

Serve **Node 24** (`node:sqlite`). Nessuna variabile d'ambiente, nessun servizio esterno.

| Comando | A cosa serve |
|---|---|
| `npm run dev` | sviluppo: `vite --host`, app e `/api` con ricaricamento a caldo |
| `npm run prova` | uso di tutti i giorni: build e `vite preview --host`, senza ricaricamenti |
| `npm test` | Vitest |
| `npm run build` | controllo dei tipi e build |
| `npm run certificati` | crea il certificato HTTPS per la rete di casa (serve mkcert) |
| `npm run icone` | rigenera le icone della PWA da `public/icona.svg` |
| `npm run sfondo` | rigenera lo sfondo doodle `src/ui/sfondo-officina.svg` |
| `npm run storico` | scrive un mese di righe inventate per C3 e Guzzi Breva ([dati di prova](#dati-di-prova)) |

- **Dal telefono**: stessa rete Wi‑Fi del Mac, indirizzo `http://<IP del Mac>:<porta>/`, stampato da Vite alla voce *Network*. Conviene dare al Mac un IP fisso sul router, così il segnalibro sul telefono non cambia.
- Il Mac deve essere **acceso e con il server avviato** quando si scrive; se non lo è, le righe restano in coda sul telefono e partono quando il Mac torna raggiungibile.

### Database

- File: `dati/logger.db`, creato al primo avvio, **escluso da git**.
- **Backup**: copiare il file con il server fermo (o con `sqlite3 dati/logger.db ".backup copia.db"` anche a server avviato).
- Per guardarci dentro: `sqlite3 dati/logger.db 'select * from voci order by quando desc limit 20'`.

### Dati di prova

`npm run storico` riempie `dati/logger.db` con un mese di righe **inventate**, fino a ieri, per provare diari, card e scelte con dati verosimili: per **C3** Km, Benzina, Pedaggio, Controllo Olio, Pressione gomme e Lavaggio; per **Guzzi Breva** i giri del weekend con Km, Benzina, Controllo Olio (anche con un valore), Pressione gomme e Lavaggio.

- I km crescono giorno per giorno e finiscono sotto l'ultimo "Km" scritto a mano per quel soggetto.
- Le righe generate hanno gli id che iniziano con `00000000-0000-4000-8000-`: rilanciando lo script si tolgono e si riscrivono, senza toccare quelle scritte dall'app. `npm run storico -- 60` genera 60 giorni, `npm run storico -- via` toglie solo le righe generate.
- Il server può restare avviato; l'app le vede al prossimo aggiornamento (ricaricando la pagina o tornando in primo piano).
- Oggi il database contiene solo righe di prova, scritte a mano o generate: al passaggio in produzione si cancellano tutte.

### HTTPS per la PWA

Il service worker, e quindi l'installazione sulla Home e la shell senza rete, funziona solo in **HTTPS** (fa eccezione `localhost`, che vale solo sul Mac). Una volta sola:

1. installare [mkcert](https://github.com/FiloSottile/mkcert) sul Mac e creare la sua autorità locale: `brew install mkcert && mkcert -install` (chiede la password del Mac, perché aggiunge l'autorità al portachiavi);
2. `npm run certificati`: crea `certificati/cert.pem` e `key.pem` (fuori da git) per `localhost`, gli IP attuali del Mac e `<nome del Mac>.local`. `vite.config.ts` li usa da solo se ci sono, sia in `dev` sia in `prova`: da lì in poi l'indirizzo è `https://…`. Se l'IP del Mac cambia, si rilancia;
3. installare sul telefono la radice di mkcert (`mkcert -CAROOT` → `rootCA.pem`, mandata per AirDrop o mail) e renderla attendibile. Su iOS: Impostazioni → Generali → VPN e gestione dispositivi → installa il profilo; poi Impostazioni → Generali → Info → Impostazioni attendibilità certificati → attiva mkcert.

Senza certificato tutto funziona in HTTP come pagina normale, coda senza rete compresa (finché la pagina resta aperta); manca solo l'installazione vera.

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
