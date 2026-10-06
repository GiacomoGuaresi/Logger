// Le scelte di Registra (docs/02-funzionalita.md#registra): i soggetti già
// usati, le chiavi già usate con quel soggetto e l'ultimo valore scritto per
// quella chiave. Vengono dal riepilogo di tutte le righe (`Uso`), non solo da
// quelle lette per il diario: una chiave usata una volta l'anno resta tra le scelte.
//
// Soggetti e chiavi si confrontano senza badare a maiuscole, minuscole e
// accenti; si mostra la forma scritta più spesso.

import type { Voce } from './voce'

/** Una coppia soggetto · chiave, scritta esattamente così, con quante volte e l'ultimo valore. */
export interface Uso {
  soggetto: string
  chiave: string
  volte: number
  /** Quando è stata scritta l'ultima riga della coppia. */
  ultimaVolta: string
  /** L'ultimo valore non vuoto, con la sua data; `null` se la coppia non ne ha mai avuti. */
  ultimoValore: { valore: string; quando: string } | null
}

/** La forma con cui si confrontano soggetti e chiavi. */
export function confrontabile(testo: string): string {
  return testo
    .trim()
    .toLocaleLowerCase('it')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

/** Gli usi con una riga in più: per le righe appena scritte, prima che il riepilogo si rilegga. */
export function conVoce(usi: readonly Uso[], voce: Voce): Uso[] {
  const i = usi.findIndex((u) => u.soggetto === voce.soggetto && u.chiave === voce.chiave)
  const prima: Uso = i >= 0 ? usi[i] : { soggetto: voce.soggetto, chiave: voce.chiave, volte: 0, ultimaVolta: voce.quando, ultimoValore: null }
  const dopo: Uso = {
    ...prima,
    volte: prima.volte + 1,
    ultimaVolta: voce.quando > prima.ultimaVolta ? voce.quando : prima.ultimaVolta,
    ultimoValore:
      voce.valore !== null && (!prima.ultimoValore || voce.quando >= prima.ultimoValore.quando)
        ? { valore: voce.valore, quando: voce.quando }
        : prima.ultimoValore,
  }
  return i >= 0 ? usi.map((u, j) => (j === i ? dopo : u)) : [...usi, dopo]
}

/**
 * Raggruppa per `chiaveDi` (senza maiuscole e accenti) e ordina dai più usati;
 * a parità, dal più recente. Di ogni gruppo dà la forma scritta più spesso.
 */
function piuUsati(usi: readonly Uso[], testoDi: (u: Uso) => string): string[] {
  const gruppi = new Map<string, { volte: number; ultimaVolta: string; forme: Map<string, number> }>()
  for (const uso of usi) {
    const testo = testoDi(uso)
    const chiave = confrontabile(testo)
    const gruppo = gruppi.get(chiave) ?? { volte: 0, ultimaVolta: '', forme: new Map<string, number>() }
    gruppo.volte += uso.volte
    if (uso.ultimaVolta > gruppo.ultimaVolta) gruppo.ultimaVolta = uso.ultimaVolta
    gruppo.forme.set(testo, (gruppo.forme.get(testo) ?? 0) + uso.volte)
    gruppi.set(chiave, gruppo)
  }
  return [...gruppi.values()]
    .sort((a, b) => b.volte - a.volte || b.ultimaVolta.localeCompare(a.ultimaVolta))
    .map(({ forme }) => [...forme].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0])
}

export function soggettiUsati(usi: readonly Uso[]): string[] {
  return piuUsati(usi, (u) => u.soggetto)
}

/** Le chiavi usate con `soggetto`; se il soggetto è vuoto, quelle di tutti. */
export function chiaviUsate(usi: readonly Uso[], soggetto: string): string[] {
  const cercato = confrontabile(soggetto)
  return piuUsati(
    cercato === '' ? usi : usi.filter((u) => confrontabile(u.soggetto) === cercato),
    (u) => u.chiave,
  )
}

/** L'ultimo valore scritto per questa coppia, o `null` se non ce n'è (o la coppia è nuova). */
export function ultimoValore(usi: readonly Uso[], soggetto: string, chiave: string): string | null {
  const s = confrontabile(soggetto)
  const c = confrontabile(chiave)
  if (s === '' || c === '') return null
  let ultimo: Uso['ultimoValore'] = null
  for (const uso of usi) {
    if (confrontabile(uso.soggetto) !== s || confrontabile(uso.chiave) !== c || !uso.ultimoValore) continue
    if (!ultimo || uso.ultimoValore.quando > ultimo.quando) ultimo = uso.ultimoValore
  }
  return ultimo?.valore ?? null
}

/** Le scelte che contengono `cercato`, senza badare a maiuscole e accenti: prima quelle che iniziano così. */
export function filtra(scelte: readonly string[], cercato: string): string[] {
  const c = confrontabile(cercato)
  if (c === '') return [...scelte]
  const inizio = scelte.filter((s) => confrontabile(s).startsWith(c))
  const dentro = scelte.filter((s) => !confrontabile(s).startsWith(c) && confrontabile(s).includes(c))
  return [...inizio, ...dentro]
}
