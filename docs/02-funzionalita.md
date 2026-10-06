# 02 · Funzionalità

## Il caso d'uso principale

1. Ho appena fatto benzina alla moto.
2. Apro l'app: il soggetto è già "moto", l'ultimo usato.
3. Scelgo "Benzina" dalla lista delle chiavi della moto; il valore mi propone l'ultimo scritto, "25€". Scrivo quello di oggi e salvo.
4. Più tardi apro il **diario** e vedo la riga con data e ora.

## Registra

È la schermata iniziale. Tre campi e un pulsante.

| Campo | Obbligatorio | Note |
|---|---|---|
| **Soggetto** | sì | **select con ricerca** tra i soggetti già inseriti, dal più usato; già impostato sull'ultimo usato su questo dispositivo |
| **Chiave** | sì | **select con ricerca** tra le chiavi già usate **con quel soggetto**, dalla più usata |
| **Valore** | no | testo libero, così com'è ("41000", "25€", "rabbocco mezzo litro"); il segnaposto mostra **l'ultimo valore** scritto per quel soggetto e quella chiave |

- La **data** è quella del salvataggio; non si modifica (per ora).
- **Select con ricerca**: toccando il campo si apre l'elenco intero; scrivendo lo si filtra (prima le scelte che iniziano col testo, poi quelle che lo contengono). Le scelte sono **solo quelle già inserite**, nessuna inventata: a database vuoto l'elenco è vuoto. Se il testo non c'è, in fondo compare **Nuovo soggetto «…»** o **Nuova chiave «…»**. Frecce, Invio ed Esc funzionano da tastiera; scelto un soggetto si passa alla chiave, scelta una chiave al valore.
- Le scelte vengono da **tutte le righe**, non solo dalle ultime lette: una chiave usata una volta l'anno resta nell'elenco. Senza rete valgono quelle in memoria, con le righe ancora in coda già contate.
- Spazi in testa e in coda si tolgono. Soggetti e chiavi si confrontano **senza badare a maiuscole, minuscole e accenti**: "Moto" e "moto" sono lo stesso soggetto, e nell'elenco compare la forma usata più spesso.
- L'**ultimo valore** è l'ultimo non vuoto per quella coppia: una riga senza valore ("Controllo olio") non lo cancella. È solo un segnaposto: se non si scrive niente, la riga si salva senza valore.
- Dopo il salvataggio la chiave e il valore si svuotano, il soggetto resta; una conferma breve dice "Salvato".

## Diario

- **Tutte le righe**, dalla più recente, raggruppate per giorno ("Oggi", "Ieri", "lunedì 5 ottobre").
- Ogni riga: ora, soggetto, chiave, valore se c'è.
- Un tocco lungo, o un cestino, **elimina** una riga dopo una conferma: serve per gli errori di battitura.
- Si caricano le ultime 100 righe; "Mostra altre" carica le precedenti.

## Senza rete

Arriva allo step 4 della [roadmap](06-roadmap.md). Durante la prova in locale serve quando il telefono perde il Wi‑Fi di casa con l'app aperta:

- all'apertura il diario si mostra subito dalle righe salvate sul dispositivo, poi si aggiorna;
- registrare ed eliminare funzionano anche senza rete: le scritture vanno in una coda locale e partono quando la rete torna;
- le righe ancora in coda hanno il segno **da inviare**.

## Idee per dopo

Solo appunti, senza impegno: entrano nella roadmap quando servono davvero.

- Filtro del diario per soggetto o per chiave
- Modifica di una riga, data compresa (per registrare qualcosa a posteriori)
- Note più lunghe su una riga
- Valori numerici riconosciuti (es. "41000" sotto "km") per vedere l'ultimo km, i km percorsi, la spesa
- Promemoria ("Controllo olio" più vecchio di 30 giorni)
- Esportazione CSV
