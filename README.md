# Logger

Diario minimo di quello che succede a **moto e auto**, e domani ad altro. Si sceglie un soggetto, si scrive una **chiave** e, se serve, un **valore**, e l'app salva la riga con la data:

```
moto · km             · 41000
moto · Benzina        · 25€
auto · Controllo olio            ← nessun valore: è solo il segno che è stato fatto
```

Poi si rilegge tutto nel **diario**, dal più recente. Nient'altro, per ora: le funzionalità si aggiungono quando ci si accorge che servono. Quarta app di casa dopo **Grocery**, **Projects** e **Trekking**.

> **Stato: prova in locale.** L'app gira sul Mac con un database SQLite, si usa dal Mac e dal telefono sulla rete di casa. Niente pubblicazione online né pipeline: se la prova regge, si passa a Supabase ([roadmap](docs/06-roadmap.md), Fase 2).

## Cosa fa

- **Registra**: soggetto, chiave, valore facoltativo; la data è quella di adesso. Soggetti e chiavi già usati compaiono come suggerimenti
- **Diario**: tutte le righe, dalla più recente, raggruppate per giorno; si può eliminare una riga sbagliata
- **Senza rete** (step 4): se il telefono perde il Wi‑Fi di casa, quello che si scrive resta in coda e parte quando la rete torna
- **Installabile** sulla schermata Home (step 5)

## Per iniziare

Serve Node 24 (c'è `node:sqlite`).

```sh
npm install
npm run dev      # http://localhost:5173/ sul Mac
npm test
npm run prova    # build + server per l'uso di tutti i giorni
```

Dal telefono, sulla stessa rete Wi‑Fi: `http://<IP del Mac>:5173/` (l'indirizzo lo stampa Vite all'avvio, alla voce *Network*). I dati stanno in `dati/logger.db`, fuori da git: per un backup basta copiare il file ([05](docs/05-esecuzione.md)).

## In breve

- **Frontend**: Vite + React + TypeScript + Tailwind, installabile come PWA
- **Dati**: SQLite (`node:sqlite`) sul Mac, dietro una piccola API servita da Vite stesso; più avanti [Supabase](https://supabase.com), come le altre app
- **Lingua**: italiano · **Costo**: 0 € · **Licenza**: MIT

## Documentazione

| Documento | Contenuto |
|---|---|
| [docs/01-visione.md](docs/01-visione.md) | Scopo, utenti, principi, cosa non è |
| [docs/02-funzionalita.md](docs/02-funzionalita.md) | Funzionalità e idee per dopo |
| [docs/03-architettura.md](docs/03-architettura.md) | Server locale, archivio sostituibile, coda offline, struttura cartelle |
| [docs/04-sicurezza.md](docs/04-sicurezza.md) | Rete di casa oggi, passphrase e permessi con Supabase |
| [docs/05-esecuzione.md](docs/05-esecuzione.md) | Avvio in locale, HTTPS per la PWA, backup; pubblicazione nella Fase 2 |
| [docs/06-roadmap.md](docs/06-roadmap.md) | Step di sviluppo |
| [docs/07-decisioni.md](docs/07-decisioni.md) | Registro delle decisioni |
| [docs/08-modello-dati.md](docs/08-modello-dati.md) | La tabella delle righe, in SQLite e in Postgres |
| [docs/09-interfaccia.md](docs/09-interfaccia.md) | Struttura, palette, icona, schermate |
| [Q&A.md](Q&A.md) | Domande ancora aperte |
