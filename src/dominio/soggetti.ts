// I diari, uno per soggetto (docs/02-funzionalita.md#diario): le card della
// pagina Diario vengono dal riepilogo degli usi. "moto" e "Moto" sono lo stesso
// diario: si raccolgono tutte le forme scritte, e si mostra la più usata.

import { confrontabile, type Uso } from './suggerimenti'

export interface Soggetto {
  /** La forma scritta più spesso: è il titolo del diario. */
  nome: string
  /** Tutte le forme scritte: servono a leggere le righe di questo diario dall'archivio. */
  forme: string[]
  volte: number
  ultimaVolta: string
  /** Le chiavi più usate, con l'ultimo valore non vuoto: l'anteprima della card. */
  chiavi: { nome: string; ultimoValore: string | null }[]
}

function piuScritta(conti: Map<string, number>): string {
  return [...conti].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]
}

/** I diari, dal più usato di recente: in cima quello dove si è scritto per ultimo. */
export function soggettiRiassunti(usi: readonly Uso[], quanteChiavi = 3): Soggetto[] {
  const gruppi = new Map<
    string,
    {
      forme: Map<string, number>
      volte: number
      ultimaVolta: string
      chiavi: Map<string, { forme: Map<string, number>; volte: number; ultimaVolta: string; ultimo: Uso['ultimoValore'] }>
    }
  >()
  for (const uso of usi) {
    const g = gruppi.get(confrontabile(uso.soggetto)) ?? { forme: new Map(), volte: 0, ultimaVolta: '', chiavi: new Map() }
    g.forme.set(uso.soggetto, (g.forme.get(uso.soggetto) ?? 0) + uso.volte)
    g.volte += uso.volte
    if (uso.ultimaVolta > g.ultimaVolta) g.ultimaVolta = uso.ultimaVolta
    const c = g.chiavi.get(confrontabile(uso.chiave)) ?? { forme: new Map<string, number>(), volte: 0, ultimaVolta: '', ultimo: null }
    c.forme.set(uso.chiave, (c.forme.get(uso.chiave) ?? 0) + uso.volte)
    c.volte += uso.volte
    if (uso.ultimaVolta > c.ultimaVolta) c.ultimaVolta = uso.ultimaVolta
    if (uso.ultimoValore && (!c.ultimo || uso.ultimoValore.quando > c.ultimo.quando)) c.ultimo = uso.ultimoValore
    g.chiavi.set(confrontabile(uso.chiave), c)
    gruppi.set(confrontabile(uso.soggetto), g)
  }
  return [...gruppi.values()]
    .map((g) => ({
      nome: piuScritta(g.forme),
      forme: [...g.forme.keys()].sort(),
      volte: g.volte,
      ultimaVolta: g.ultimaVolta,
      chiavi: [...g.chiavi.values()]
        .sort((a, b) => b.volte - a.volte || b.ultimaVolta.localeCompare(a.ultimaVolta))
        .slice(0, quanteChiavi)
        .map((c) => ({ nome: piuScritta(c.forme), ultimoValore: c.ultimo?.valore ?? null })),
    }))
    .sort((a, b) => b.ultimaVolta.localeCompare(a.ultimaVolta) || a.nome.localeCompare(b.nome))
}

/** Il diario che corrisponde al nome nell'indirizzo, senza badare a maiuscole e accenti. */
export function trovaSoggetto(soggetti: readonly Soggetto[], nome: string): Soggetto | null {
  const cercato = confrontabile(nome)
  return soggetti.find((s) => confrontabile(s.nome) === cercato) ?? null
}
