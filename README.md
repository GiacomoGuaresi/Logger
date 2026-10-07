# Logger

Diario minimo di **qualunque cosa** valga la pena tenere a mente: la moto e l'auto per cominciare, poi quello che serve. Si sceglie un soggetto, si scrive una **chiave** e, se serve, un **valore**, e l'app salva la riga con la data:

```
moto · km             · 41000
moto · Benzina        · 25€
auto · Controllo olio            ← nessun valore: è solo il segno che è stato fatto
```

Poi si rilegge tutto nel **diario**, dal più recente. Nient'altro, per ora: le funzionalità si aggiungono quando ci si accorge che servono. Quarta app di casa dopo **Grocery**, **Projects** e **Trekking**.

> **Stato: in produzione dalla 1.0** su **https://giacomoguaresi.github.io/Logger/**, con i dati su Supabase ([roadmap](docs/06-roadmap.md)).

## Cosa fa

- **Registra**: soggetto e chiave si toccano tra quelli già inseriti (o se ne aggiunge uno nuovo), il valore è facoltativo e propone l'ultimo scritto, col tastierino numerico e l'unità già messa se era un numero; la data è adesso, oppure ieri o quando si vuole
- **Diario**: un diario per soggetto, come timeline verticale dalla giornata più recente, con le righe dello stesso giorno insieme e un filtro per chiave; toccando una riga la si corregge, data compresa, o la si elimina (con Annulla)
- **Senza rete**: quello che si scrive resta in coda sul telefono e parte quando la rete torna, una volta sola
- **Accesso** con la sola passphrase, con la sessione condivisa con le altre app di casa
- **Installabile** sulla schermata Home

## Per iniziare

Serve Node 24 e un `.env.local` copiato da `.env.example`, con gli stessi valori delle altre app.

```sh
nvm use                # Node 24, da .nvmrc
npm install
cp .env.example .env.local   # e riempilo
npm run dev            # http://localhost:5173/Logger/ (dati veri di produzione!)
npm test
npm run prova          # build + anteprima, com'è in produzione
```

Pubblicazione, Supabase e backup: [05](docs/05-esecuzione.md).

## In breve

- **Frontend**: Vite + React + TypeScript + Tailwind, installabile come PWA
- **Dati**: [Supabase](https://supabase.com), progetto condiviso con le altre app, schema `logger`; accesso con passphrase
- **Hosting**: GitHub Pages
- **Lingua**: italiano · **Costo**: 0 € · **Licenza**: MIT

## Documentazione

| Documento | Contenuto |
|---|---|
| [docs/01-visione.md](docs/01-visione.md) | Scopo, utenti, principi, cosa non è |
| [docs/02-funzionalita.md](docs/02-funzionalita.md) | Funzionalità e idee per dopo |
| [docs/03-architettura.md](docs/03-architettura.md) | Supabase, archivio sostituibile, coda offline, struttura cartelle |
| [docs/04-sicurezza.md](docs/04-sicurezza.md) | Passphrase, chiavi e permessi su Supabase |
| [docs/05-esecuzione.md](docs/05-esecuzione.md) | Sviluppo, pubblicazione, Supabase, backup |
| [docs/06-roadmap.md](docs/06-roadmap.md) | Step di sviluppo |
| [docs/07-decisioni.md](docs/07-decisioni.md) | Registro delle decisioni |
| [docs/08-modello-dati.md](docs/08-modello-dati.md) | La tabella delle righe e il riepilogo, in Postgres |
| [docs/09-interfaccia.md](docs/09-interfaccia.md) | Struttura, palette, icona, schermate |
| [Q&A.md](Q&A.md) | Domande ancora aperte |
