# 02 · Funzionalità

## Il caso d'uso principale

1. Ho appena fatto benzina alla moto.
2. Apro l'app: il soggetto è già "moto", l'ultimo usato.
3. Scrivo "Benzina" (o lo tocco tra i suggerimenti), "25€", salvo.
4. Più tardi apro il **diario** e vedo la riga con data e ora.

## Registra

È la schermata iniziale. Tre campi e un pulsante.

| Campo | Obbligatorio | Note |
|---|---|---|
| **Soggetto** | sì | testo; già impostato sull'ultimo usato su questo dispositivo; sotto, i soggetti già usati come pulsanti da toccare |
| **Chiave** | sì | testo; sotto, le chiavi già usate **con quel soggetto**, dalla più usata, come pulsanti da toccare |
| **Valore** | no | testo libero, così com'è ("41000", "25€", "rabbocco mezzo litro") |

- La **data** è quella del salvataggio; non si modifica (per ora).
- Spazi in testa e in coda si tolgono. Soggetti e chiavi si confrontano **senza badare a maiuscole e minuscole**: chi scrive "Moto" vede i suggerimenti di "moto", e tra i suggerimenti compare la forma usata più spesso.
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
