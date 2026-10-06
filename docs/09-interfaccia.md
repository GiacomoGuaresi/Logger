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

Disegno Lucide **`gauge`** (contachilometri) panna su grafite `#3f444e`, in `public/icona.svg`, da cui `npm run icone` genera le icone della PWA.

## Sfondo

**Sfondo doodle** a tema strada e officina (chiavi inglesi, gocce d'olio, pompe di benzina, ruote, caschi), generato da `scripts/genera-sfondo.ts` con un seed fisso, come nelle altre app. Arriva allo step 5.

## Schermate

| Schermata | Contenuto |
|---|---|
| **Registra** (`#/`, pagina principale) | tre campi uno sotto l'altro: **Soggetto** e **Chiave** sono select con ricerca (elenco a tendina sotto il campo, voce scelta col segno ✓, "Nuovo … «testo»" in fondo), **Valore** è libero con l'ultimo valore come segnaposto; **Salva** grande in basso |
| **Diari** (`#/diario`) | "Scegli il diario": una card bianca per soggetto con nome, ultima volta, numero di righe e le chiavi più usate col loro ultimo valore; freccia a destra |
| **Diario di un soggetto** (`#/diario/<soggetto>`) | in cima ‹ Diari, il nome del soggetto e + Riga; righe raggruppate per giorno, ognuna con ora, chiave in evidenza, valore a destra; cestino con conferma; "Mostra altre" in fondo |
| **Accesso** | dalla Fase 2: solo passphrase, come le altre app |
