# 09 · Interfaccia

## Coerenza con le altre app

Stessa struttura di Grocery, Projects e Trekking, con un colore diverso:
- **intestazione piena** nel colore dell'app, con ☰ a sinistra;
- **menu laterale** a scomparsa, sempre aperto su schermi larghi: **Registra**; poi la sezione **Diari** con **Tutti i diari** (le card) e una voce per ogni diario, in ordine alfabetico, col numero di righe a destra; in fondo **Installa l'app**. La voce della pagina aperta, diario compreso, ha la barra ambra;
- stesso font e stesse icone Lucide;
- solo **italiano** e solo **tema chiaro**.

## Palette · grafite e ambra (proposta)

Le altre app sono terracotta (Grocery), verde (Projects) e blu (Trekking): Logger prende i colori di un cruscotto.

| Uso | Colore | Note |
|---|---|---|
| Intestazione, pulsanti principali, `theme_color` della PWA | `#3f444e` | grafite |
| Accento, conferme | `#d9922e` | ambra, come una spia del cruscotto |
| Sfondo, `background_color` della PWA | `#f4f3ef` | grigio caldo molto chiaro |
| Testo e icone sull'intestazione | `#fbf8f1` | panna, come nelle altre app |

## Icona

Disegno Lucide **`notebook-pen`** (quaderno con la penna): quaderno panna e penna ambra su grafite `#3f444e`, generico come lo scopo dell'app, loggare qualunque cosa; in `public/icona.svg`, da cui `npm run icone` genera le icone della PWA.

## Sfondo

**Sfondo doodle** a tema strada e officina (chiavi inglesi, gocce d'olio, pompe di benzina, ruote, caschi), generato da `scripts/genera-sfondo.ts` con un seed fisso, come nelle altre app. Arriva allo step 5.

## Schermate

| Schermata | Contenuto |
|---|---|
| **Registra** (`#/`, pagina principale; nel passo del valore la riga "🕒 Adesso · Ieri · Cambia", con la data scelta in ambra; `#/registra/<soggetto>` dal "+ Riga" del diario) | a passi, ognuno con una breve entrata: prima solo **Soggetto**, poi **Chiave**, poi **Valore** con Salva; il passo fatto resta come pillola grafite con ✓ e matita, accanto all'etichetta in grigio. **Soggetto** e **Chiave** sono pulsanti a pillola alti 44px che vanno a capo (scelto: grafite pieno col segno ✓ ambra; chiave con l'ultimo valore in piccolo; "+ Nuovo" tratteggiato in fondo, che apre un campo di ricerca); sotto, **Valore** con l'unità in fondo al campo e, sulla stessa riga, **Salva**; sopra il campo "abc/123" per la tastiera e il pulsante ↺ con l'ultimo valore |
| **Diari** (`#/diario`) | "Scegli il diario": una card bianca per soggetto con nome, ultima volta, numero di righe e le chiavi più usate col loro ultimo valore; freccia a destra |
| **Diario di un soggetto** (`#/diario/<soggetto>`) | in cima ‹ Diari, il nome del soggetto e + Riga; sotto, la tendina nativa del filtro per chiave, larga quanto la pagina (attiva: grafite pieno, con × accanto); timeline verticale: linea grigia a sinistra con un pallino per giornata (ambra il più recente, grafite gli altri), accanto una card bianca con la data gg/mm/aaaa in piccolo e le righe del giorno separate da un filo, ognuna con la chiave in evidenza, il valore a destra; toccando una riga sale dal basso il foglio di modifica (chiave, valore, quando; Elimina in rosso a sinistra, Annulla e Salva a destra); eliminando, in basso un avviso grafite con "Annulla" in ambra; "Mostra altre" in fondo |
| **Accesso** | dalla Fase 2: solo passphrase, come le altre app |
