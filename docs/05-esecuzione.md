# 05 · Esecuzione e manutenzione

## Sviluppo

Serve **Node 24** (`.nvmrc`) e un file `.env.local` copiato da `.env.example`, con gli stessi valori delle altre app ([04](04-sicurezza.md#chiavi-e-variabili)).

⚠️ Come Trekking, anche in sviluppo Logger usa il **progetto Supabase di produzione**: `npm run dev` legge e scrive i dati veri.

| Comando | A cosa serve |
|---|---|
| `npm run dev` | sviluppo: `vite --host`, l'app si apre dal Mac e, all'IP del Mac, dal telefono |
| `npm run prova` | build e `vite preview --host`: com'è in produzione, all'indirizzo `/Logger/` |
| `npm test` | Vitest; i test su Supabase girano solo con le variabili `SUPABASE_TEST_*` di un Supabase locale |
| `npm run build` | controllo dei tipi e build |
| `npm run icone` | rigenera le icone della PWA da `public/icona.svg` |
| `npm run sfondo` | rigenera lo sfondo doodle `src/ui/sfondo-diario.svg` |

Senza `.env.local` la build riesce, ma l'app dice "Non riesco a collegarmi al database condiviso".

## Pubblicazione

- **Repository** pubblico `github.com/GiacomoGuaresi/Logger`, licenza MIT, branch `main`. Prima di renderlo pubblico la storia non deve contenere `dati/`, `certificati/` né file `.env*` (`git log --all --stat -- dati certificati .env .env.local`).
- **GitHub Pages** su `https://giacomoguaresi.github.io/Logger/` (Settings → Pages → Source: GitHub Actions). Il workflow `.github/workflows/pubblica.yml` a ogni push su `main`: `npm ci`, controllo delle variabili, `npm test`, `npm run build`, deploy.
- **Variabili** del repository (Settings → Secrets and variables → Actions → Variables): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_EMAIL`, stessi valori delle altre app.

### Supabase, una volta

Sul progetto di produzione di Grocery, dalla cartella di Grocery già collegata:

1. eseguire gli script in ordine:
   ```sh
   supabase db query --linked -f ../Logger/supabase/sql/001_schema.sql
   supabase db query --linked -f ../Logger/supabase/sql/002_voci.sql
   supabase db query --linked -f ../Logger/supabase/sql/003_usi.sql
   ```
2. aggiungere `logger` agli *Exposed schemas* (Management API `PATCH /v1/projects/{ref}/postgrest`, `db_schema` con la lista **sempre intera**: `public,graphql_public,projects,trekking,logger`);
3. aggiungere `https://giacomoguaresi.github.io/Logger/` agli URL di redirect di Auth (`uri_allow_list`, anche questa intera);
4. la checklist di [04](04-sicurezza.md#checklist-prima-di-pubblicare).

Il token della Management API sta in `credenziali.local` nella cartella sopra i repository, mai nel repo.

⚠️ Il progetto Supabase è quello di produzione di Grocery: ogni modifica alla configurazione va fatta senza toccare le impostazioni usate dalle altre app. Si parte con la tabella vuota: le righe della prova in locale erano solo di prova e non si copiano.

## Backup

I dati stanno su Supabase, nei backup giornalieri del progetto. Per una copia a mano:

```sh
supabase db dump --linked --data-only --schema logger -f logger-$(date +%F).sql
```

## Aggiornare l'app

Un push su `main` pubblica. La PWA si aggiorna da sola (`registerType: 'autoUpdate'`) alla prossima apertura con la rete. Una modifica allo schema è uno script nuovo in `supabase/sql/`, numerato, da applicare **prima** del push che lo usa.
