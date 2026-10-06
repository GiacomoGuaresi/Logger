// I suggerimenti di Registra (docs/02-funzionalita.md#registra): i soggetti già
// usati, e le chiavi già usate con quel soggetto, dai più usati. Si confrontano
// senza badare a maiuscole e minuscole, e si mostra la forma scritta più spesso.

import type { Voce } from './voce'

/** La forma con cui si confrontano soggetti e chiavi. */
export function confrontabile(testo: string): string {
  return testo.trim().toLocaleLowerCase('it')
}

function piuUsati(testi: readonly string[], massimo: number): string[] {
  // Le righe arrivano dalla più recente: a parità d'uso vince quella usata per ultima.
  const gruppi = new Map<string, { volte: number; forme: Map<string, number>; ordine: number }>()
  testi.forEach((testo, ordine) => {
    const chiave = confrontabile(testo)
    const gruppo = gruppi.get(chiave) ?? { volte: 0, forme: new Map<string, number>(), ordine }
    gruppo.volte += 1
    gruppo.forme.set(testo, (gruppo.forme.get(testo) ?? 0) + 1)
    gruppi.set(chiave, gruppo)
  })
  return [...gruppi.values()]
    .sort((a, b) => b.volte - a.volte || a.ordine - b.ordine)
    .slice(0, massimo)
    .map(({ forme }) => {
      let migliore = ''
      let volte = 0
      for (const [forma, n] of forme) {
        // `>` stretto: a parità vince la forma vista per prima, cioè la più recente.
        if (n > volte) {
          migliore = forma
          volte = n
        }
      }
      return migliore
    })
}

export function soggettiUsati(voci: readonly Voce[], massimo = 6): string[] {
  return piuUsati(
    voci.map((v) => v.soggetto),
    massimo,
  )
}

/** Le chiavi usate con `soggetto`; se il soggetto è vuoto, quelle di tutti. */
export function chiaviUsate(voci: readonly Voce[], soggetto: string, massimo = 8): string[] {
  const cercato = confrontabile(soggetto)
  const delSoggetto = cercato === '' ? voci : voci.filter((v) => confrontabile(v.soggetto) === cercato)
  return piuUsati(
    delSoggetto.map((v) => v.chiave),
    massimo,
  )
}
