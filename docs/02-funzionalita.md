# 02 · Funzionalità

## Il caso d'uso principale

1. Ho appena fatto benzina alla moto.
2. Apro l'app e tocco "moto": compaiono le sue chiavi.
3. Tocco "Benzina" tra le chiavi della moto: si apre il tastierino numerico, con "€" già in fondo al campo e l'ultimo valore, "25€", come riferimento. Scrivo "27" e tocco Salva: la riga è "27€".
4. Più tardi apro il **diario** e vedo la riga con data e ora.

## Registra

È la schermata iniziale, pensata per il telefono e per il pollice: **soggetto e chiave si toccano**, la tastiera si apre solo per il valore. I campi **compaiono uno alla volta**: all'apertura c'è solo il soggetto; scelto il soggetto compare la chiave; scelta la chiave compaiono il valore e Salva. Il passo fatto si riduce a una pillola ("Soggetto ✓ moto ✎"): toccandola si torna a scegliere (cambiando soggetto si ricomincia dalla chiave). Una riga è soggetto, chiave, numero e Salva; dopo la prima, con il soggetto che resta, chiave, numero e Salva.

| Campo | Obbligatorio | Note |
|---|---|---|
| **Soggetto** | sì | **pulsanti** con i soggetti già inseriti, dal più usato; all'apertura nessuno è scelto, tranne arrivando da **+ Riga** di un diario (`#/registra/<soggetto>`) |
| **Chiave** | sì | **pulsanti** con le chiavi già usate **con quel soggetto**, dalla più usata, ognuna col suo ultimo valore in piccolo ("Benzina 25€") |
| **Valore** | no | testo libero, così com'è ("41000", "25€", "rabbocco mezzo litro"); il segnaposto mostra **l'ultimo valore** scritto per quel soggetto e quella chiave |

- La **data** è **adesso** (il momento in cui si salva), ma si può cambiare per registrare qualcosa a posteriori: nel passo del valore, la riga "🕒 Adesso" ha **Ieri** (stessa ora, ieri) e **Cambia**, che apre il selettore di data e ora del telefono. Una data scelta si vede in ambra ("Ieri 18:40"), con **Adesso ×** per tornare indietro; non può stare nel futuro. Dopo il salvataggio torna ad adesso.
- **Pulsanti**: si vedono i 6 soggetti e le 12 chiavi più usati, gli altri con **Altre N**. Le scelte sono **solo quelle già inserite**, nessuna inventata. **+ Nuovo** / **+ Nuova** apre un campo che filtra i pulsanti mentre si scrive (prima le scelte che iniziano col testo, poi quelle che lo contengono); se il testo non c'è, compare **Nuova chiave «…»**, e Invio sceglie. A database vuoto il campo è già aperto. Cambiando soggetto la chiave si svuota.
- **Dopo la chiave**: se la chiave ha già avuto un valore il fuoco va sul campo Valore e si apre la tastiera; se non ne ha mai avuti ("Controllo olio") la tastiera resta chiusa, basta toccare Salva.
- **Valore numerico**: se l'ultimo valore è un numero, anche con un'unità breve dopo ("41000", "25€", "1,5 l", "2,4 bar"), si apre il **tastierino numerico** e l'unità si vede in fondo al campo: scrivendo solo un numero, si salva con l'unità ("27" → "27€"). **abc** passa alla tastiera con le lettere, per scrivere "pieno"; **123** torna al tastierino.
- **Ripeti**: accanto all'etichetta del valore, un pulsante con l'ultimo valore lo riscrive nel campo con un tocco.
- **Salva** sta accanto al campo Valore, così resta visibile con la tastiera aperta (il tastierino numerico non ha Invio).
- Le scelte vengono da **tutte le righe**, non solo dalle ultime lette: una chiave usata una volta l'anno resta nell'elenco. Senza rete valgono quelle in memoria, con le righe ancora in coda già contate.
- Spazi in testa e in coda si tolgono. Soggetti e chiavi si confrontano **senza badare a maiuscole, minuscole e accenti**: "Moto" e "moto" sono lo stesso soggetto, e nell'elenco compare la forma usata più spesso.
- L'**ultimo valore** è l'ultimo non vuoto per quella coppia: una riga senza valore ("Controllo olio") non lo cancella. È solo un segnaposto: se non si scrive niente, la riga si salva senza valore.
- Dopo il salvataggio la chiave e il valore si svuotano, il soggetto resta e ricompaiono le sue chiavi, la tastiera si chiude; una conferma breve dice "Salvato".

## Diario

Un **diario per soggetto**, separato dagli altri: prima si sceglie il soggetto, poi si leggono le sue righe. Ogni diario si apre anche **direttamente dal menu laterale**, dove sono elencati tutti in ordine alfabetico.

- **Scegli il diario**: una card per soggetto, in cima quello dove si è scritto per ultimo. Ogni card dice quante righe ha, quando è stata scritta l'ultima ("oggi 08:12", "ieri 18:40", "5 ott") e l'ultimo valore delle tre chiavi più usate ("km · 41000").
- **Il diario di un soggetto** (`#/diario/moto`): le sue righe, dalla più recente, su una **timeline verticale** da scorrere: una linea a sinistra con un pallino per **giornata** (ambra la più recente), e accanto una card con la data ("02/10/2026") e, sotto, le righe di quel giorno: chiave e valore a destra, se c'è. In cima **‹ Diari** per tornare all'elenco e **+ Riga** per aprire Registra già su questo soggetto, partendo dalla chiave.
- **Filtro per chiave**: sopra la timeline una **tendina** "Tutte le chiavi", con le chiavi del soggetto dalla più usata e quante righe ha ciascuna ("Benzina (3)"). Sul telefono apre il selettore di sistema, che le mostra tutte anche se sono tante. Si sceglie **una chiave alla volta**; la tendina diventa grafite e accanto compare **×** per tornare a tutte. Il filtro vale sulle righe già caricate: se non ne trova, suggerisce "Mostra altre". Cambiando diario il filtro si azzera.
- "moto" e "Moto" sono lo stesso diario: si raccolgono tutte le forme scritte, e il titolo è quella usata più spesso.
- **Toccando una riga** si apre la modifica: chiave, valore e data (con il selettore del telefono). Il soggetto non cambia, così la riga resta nel suo diario; se la data cambia, la riga si sposta nella giornata giusta.
- Dalla modifica si **elimina**: subito, senza conferma, e in basso compare "Eliminata: … · **Annulla**" per 5 secondi, che rimette la riga com'era (stesso id e stessa data). Modifica, eliminazione e Annulla funzionano anche senza rete.
- Si caricano le ultime 100 righe del soggetto; "Mostra altre" carica le precedenti.

## Senza rete

Serve quando il telefono è senza rete (in garage, in montagna, in metropolitana):

- all'apertura il diario si mostra subito dalle righe salvate sul dispositivo, poi si aggiorna;
- registrare ed eliminare funzionano anche senza rete: le scritture vanno in una coda locale e partono quando la rete torna;
- le righe ancora in coda hanno il segno **da inviare**.

## Idee per dopo

Solo appunti, senza impegno: entrano nella roadmap quando servono davvero.

- Note più lunghe su una riga
- Valori numerici riconosciuti (es. "41000" sotto "km") per vedere l'ultimo km, i km percorsi, la spesa
- Promemoria ("Controllo olio" più vecchio di 30 giorni)
- Esportazione CSV
