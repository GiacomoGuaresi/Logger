# 03 · Architettura

## Schema generale

Oggi, nella prova in locale:

```mermaid
flowchart LR
  M[Browser sul Mac] -->|localhost:5173| V
  T[Telefono · stesso Wi-Fi] -->|IP del Mac:5173| V
  T <-->|coda e cache| LS[(localStorage)]
  subgraph MAC[Mac]
    V[Vite<br/>app + plugin /api] --> DB[(dati/logger.db<br/>SQLite)]
  end
  V -.->|Fase 2| SB[(Supabase<br/>schema logger)]
```

## Come funziona

1. **Un solo processo**: Vite serve l'app e, con un plugin (`server/pluginApi.ts`), anche le rotte `/api`. Il plugin si aggancia sia al server di sviluppo (`configureServer`) sia a `vite preview` (`configurePreviewServer`).
   - `npm run dev` → `vite --host`: l'app si apre dal Mac e, all'IP del Mac, dal telefono;
   - `npm run prova` → build + `vite preview --host`, per l'uso di tutti i giorni.
2. Il database è **SQLite**, con il modulo **`node:sqlite`** incluso in Node 24: nessuna dipendenza nativa da compilare. Il file è `dati/logger.db`, escluso da git; la tabella si crea all'avvio se manca ([08](08-modello-dati.md)).
3. L'**API** è minima, in JSON:

   | Rotta | Cosa fa |
   |---|---|
   | `GET /api/voci?soggetto=moto&soggetto=Moto&prima=<quando>&limite=100` | il diario di un soggetto (tutte le forme scritte), dalla riga più recente; `prima` serve a "Mostra altre"; senza `soggetto`, le righe di tutti |
   | `PUT /api/voci/:id` | salva una riga; se l'`id` esiste già la sovrascrive (upsert), così rimandarla non crea doppioni |
   | `DELETE /api/voci/:id` | elimina una riga; eliminarne una che non c'è non è un errore |
   | `GET /api/usi` | il riepilogo di tutte le righe: una voce per coppia soggetto · chiave, con quante volte, l'ultima volta e l'ultimo valore non vuoto |

   I dati arrivano dal browser e si controllano anche sul server, con la stessa pulizia del dominio (`src/dominio/`).
4. Le **scelte** di soggetti e chiavi e l'**ultimo valore** vengono dal riepilogo `GET /api/usi`, non dalle righe lette per il diario: così ci sono anche i soggetti e le chiavi usati di rado. Il raggruppamento senza maiuscole e accenti si fa nel browser (`src/dominio/suggerimenti.ts`); il riepilogo si tiene in memoria per quando manca la rete, e le righe in coda ci si aggiungono subito.

## Archivio sostituibile

Il resto dell'app conosce solo l'interfaccia **`Archivio`**, come lo `Storage` di Grocery (`Grocery/src/storage/tipi.ts`):

```ts
interface Archivio {
  leggi(opzioni: { prima?: string; limite: number }): Promise<Voce[]>
  usi(): Promise<Uso[]>              // riepilogo per soggetto · chiave
  salva(voce: Voce): Promise<void>   // upsert per id
  elimina(id: string): Promise<void>
}
```

| Implementazione | Dove gira | Quando |
|---|---|---|
| `ArchivioSqlite` | server (plugin di Vite) | oggi |
| `ArchivioHttp` | browser, parla con `/api` | oggi |
| `ArchivioSupabase` | browser, parla con Supabase | Fase 2 |

I **test di contratto** (`src/dati/contratto.ts`, `verificaContratto(apriVuoto)`, come `Grocery/src/storage/contratto.ts`) descrivono cosa ci si aspetta da qualunque archivio. Oggi girano su `ArchivioSqlite` con un database `:memory:`; nella Fase 2 gli stessi test devono passare su `ArchivioSupabase`. Così il passaggio cambia una riga nel punto d'ingresso dei dati, non l'app.

## Senza rete

Arriva allo step 4 ([06](06-roadmap.md)). Serve quando il telefono perde il Wi‑Fi di casa con l'app aperta, e servirà ancora di più con Supabase. Lo schema è quello di Grocery (`Grocery/src/storage/memoriaLocale.ts` e `sincronizzatore.ts`), più semplice:

- **Memoria locale** in `localStorage`, dietro un'interfaccia `Scaffale` (nei test una `Map`):
  - `logger.diari`: le ultime righe lette di ogni diario, per aprirlo subito;
  - `logger.usi`: il riepilogo per le card dei diari e le scelte di Registra;
  - `logger.coda`: le scritture non ancora arrivate all'archivio, dalla più vecchia;
- Ogni **riga ha l'`id` generato dal browser** (`crypto.randomUUID()`) e la data del momento in cui si scrive: una scrittura in coda è un `salva` o un `elimina` per `id`, quindi **rimandarla due volte non fa danni**, e la data resta quella vera anche se arriva dopo.
- Il **sincronizzatore** (`src/dati/sincronizzatore.ts`) svuota la coda in ordine quando l'app si apre, torna la rete (`online`), l'app torna in primo piano, si salva una riga o, con righe in attesa, ogni 30 secondi. Si ferma al primo errore di rete e riprova dopo; una scrittura **rifiutata** (dati non validi) si toglie dalla coda e si segnala, per non bloccare le altre.
- Il service worker della PWA mette in cache solo la **shell** dell'app (step 5, serve HTTPS: [05](05-esecuzione.md#https-per-la-pwa)).

## Stack

| Livello | Scelta | Note |
|---|---|---|
| Linguaggio | TypeScript | anche il server, eseguito da Vite |
| UI | React 19 | |
| Build e server | Vite, `--host` | il plugin `/api` vive dentro Vite |
| Database | SQLite con `node:sqlite` | Node 24, dove è ancora segnato sperimentale (stampa un avviso all'avvio); Supabase nella Fase 2 |
| Routing | hash router | come le altre app, pronto per GitHub Pages |
| Stile | Tailwind CSS, come Projects e Trekking | palette in [09](09-interfaccia.md) |
| Icone | lucide-react | |
| Memoria locale | localStorage | cache e coda, come Grocery |
| PWA | vite-plugin-pwa | con HTTPS locale via mkcert ([05](05-esecuzione.md#https-per-la-pwa)) |
| Test | Vitest, sulla logica pura e sul contratto dell'archivio | |
| Versioni | git **solo locale**, nessun repository remoto né pipeline | |

## Test

Come nelle altre app, i test coprono la **logica pura**:
- pulizia e validazione di soggetto, chiave e valore;
- contratto dell'archivio: salva e rilegge, upsert per id, ordine dal più recente, pagina con `prima` e `limite`, eliminazione anche di una riga che non c'è;
- rotte dell'API: risposte e codici per richieste valide e non valide;
- scelte: soggetti e chiavi per soggetto, confronto senza maiuscole e accenti, ordine per uso, forma più usata, filtro della ricerca, ultimo valore della coppia;
- contratto del riepilogo `usi`: conteggi e ultimo valore non vuoto;
- giornate della timeline (gg/mm/aaaa nel fuso di chi guarda) e date delle card ("oggi 08:12");
- dallo step 4: coda (aggiunta, invio in ordine, stop al primo errore di rete, scarto delle scritture rifiutate) e lettura della memoria locale con dati vecchi o rovinati.

## Struttura cartelle

```
Logger/
├── README.md · Q&A.md · LICENSE
├── docs/
├── index.html · vite.config.ts · package.json · tsconfig.json
├── server/                # pluginApi.ts, rotte.ts, archivioSqlite.ts (+ test)
├── scripts/               # certificati.ts, genera-sfondo.ts, storico-di-prova.ts
├── dati/                  # logger.db, escluso da git
├── certificati/           # cert.pem e key.pem per l'HTTPS, esclusi da git
├── public/                # icone PWA (step 5)
└── src/
    ├── main.tsx
    ├── dominio/           # logica pura + test
    ├── dati/              # Archivio, ArchivioHttp, contratto.ts, memoria locale, sincronizzatore
    └── ui/                # guscio, Registra, Diario
```

Lo scaffold si copia da Trekking, senza le parti di Supabase, mappa e Markdown.

## Dopo la prova: convivenza con le altre app

Nella Fase 2 Logger passa al **progetto Supabase di produzione di Grocery**, come Projects e Trekking:

- **schema Postgres dedicato `logger`**, aggiunto agli *Exposed schemas* dell'API; il client si crea con `db: { schema: 'logger' }`;
- **autenticazione condivisa**: stesso utente Auth delle altre app, sessione nei cookie con percorso `/`;
- **migrazioni** in `supabase/sql/NNN_descrizione.sql`, numerate e applicate a mano; lo storico della CLI resta a Grocery;
- le righe di `logger.db` si copiano con uno script, mantenendo `id` e `quando` ([08](08-modello-dati.md#passaggio-a-supabase)).
