# 01 · Visione

## Scopo

**Logger** è un diario minimo. Il primo uso è tenere traccia di **moto e auto**: i km, i rifornimenti, i controlli dell'olio e le altre cose che si fanno. Serve a scriverle **nel momento in cui succedono** (al distributore, in garage, appena parcheggiato) e a rileggerle dopo.

Ogni registrazione è una riga **soggetto · chiave · valore**, con la data:
- il **soggetto** è la cosa di cui si parla: "moto", "auto", domani altro;
- la **chiave** è cosa è successo: "km", "Benzina", "Controllo olio";
- il **valore** è facoltativo e libero: "41000", "25€". Se manca, la riga dice solo che la cosa è stata fatta.

Non ci sono tipi, campi o moduli da configurare: un soggetto o una chiave nuovi nascono la prima volta che si scrivono.

Le funzionalità sono descritte in [02](02-funzionalita.md).

## Come cresce

L'app parte **minima** e cresce solo quando l'uso mostra cosa manca. Le idee per dopo stanno in [02 · Idee per dopo](02-funzionalita.md#idee-per-dopo), senza impegno; quando una diventa necessaria, entra nella [roadmap](06-roadmap.md) come step nuovo.

## Volumi attesi

- Soggetti: **pochi**
- Righe: **qualche centinaio all'anno**

## Principi

Quelli di Grocery, Projects e Trekking, adattati alla prova in locale:

1. **Semplice e rapido**: una riga si scrive in pochi secondi da telefono.
2. **Minimo**: niente che non serva già oggi.
3. **Gratuito**: nessun costo di hosting o database.
4. **Privato**: i dati li vede solo chi è sulla rete di casa oggi, solo chi accede con la passphrase domani.
5. **Prima si prova**: si usa in locale sul Mac, con SQLite; se regge, passa a Supabase come le altre app, senza server da mantenere.

## Utenti

Il proprietario e la partner, **allo stesso livello**, con l'account condiviso delle altre app.

## Cosa NON è (per ora)

- Un'app di statistiche, grafici o promemoria: il valore è testo libero e non si fanno calcoli
- Un catalogo di tipi di evento con campi e moduli
- Un archivio di documenti: niente foto di scontrini o libretti
