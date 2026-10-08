/** Comparação de dois textos: linha a linha e, dentro das linhas trocadas, palavra a palavra. */

export interface DiffOptions {
  ignoreCase: boolean
  /** Ignora espaços no começo e no fim e trata vários espaços como um. */
  ignoreSpaces: boolean
}

export type RowType = 'equal' | 'add' | 'remove'

export interface Part {
  text: string
  /** A palavra é uma das que mudaram dentro da linha. */
  changed: boolean
}

export interface Row {
  type: RowType
  text: string
  /** Número da linha no texto original (some nas linhas novas) e no texto novo (some nas removidas). */
  oldNumber?: number
  newNumber?: number
  /** Palavras da linha, marcando as que mudaram. Só existe nas linhas trocadas por outra parecida. */
  parts?: Part[]
}

export interface DiffResult {
  rows: Row[]
  added: number
  removed: number
  equal: number
}

/** Limite de comparações (linhas do original × linhas do novo) para a página não travar. */
export const MAX_CELLS = 4_000_000

const keyOf = (text: string, options: DiffOptions): string => {
  let key = text
  if (options.ignoreSpaces) key = key.trim().replace(/\s+/g, ' ')
  if (options.ignoreCase) key = key.toLocaleLowerCase('pt-BR')
  return key
}

/**
 * Maior subsequência comum entre duas listas de chaves; devolve os pares de índices que casam, em ordem.
 * Programação dinâmica: O(n × m) de tempo e de memória.
 */
function commonPairs(a: readonly string[], b: readonly string[]): Array<[number, number]> {
  const width = b.length + 1
  const table = new Uint32Array((a.length + 1) * width)
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * width + j] = a[i] === b[j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1])
    }
  }
  const pairs: Array<[number, number]> = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      pairs.push([i, j])
      i++
      j++
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) i++
    else j++
  }
  return pairs
}

/** Palavras, espaços e cada sinal de pontuação, na ordem: "Silva." vira ["Silva", "."], para só o ponto aparecer como mudança. */
const tokens = (text: string): string[] => text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu) ?? []

/** Marca as palavras que mudaram entre duas linhas. Devolve as partes de cada lado. */
export function wordDiff(before: string, after: string, options: DiffOptions): { before: Part[]; after: Part[] } {
  const a = tokens(before)
  const b = tokens(after)
  const pairs = commonPairs(a.map((token) => keyOf(token, options)), b.map((token) => keyOf(token, options)))
  const keptA = new Set(pairs.map(([i]) => i))
  const keptB = new Set(pairs.map(([, j]) => j))
  const merge = (list: string[], kept: Set<number>): Part[] => {
    const parts: Part[] = []
    // O espaço entre duas palavras que mudaram entra no mesmo destaque, para ele não sair em pedaços.
    const isChanged = (index: number): boolean => !kept.has(index)
    list.forEach((text, index) => {
      const gap = /^\s+$/.test(text) && index > 0 && index < list.length - 1 && isChanged(index - 1) && isChanged(index + 1)
      const changed = isChanged(index) || gap
      const last = parts[parts.length - 1]
      if (last && last.changed === changed) last.text += text
      else parts.push({ text, changed })
    })
    return parts
  }
  return { before: merge(a, keptA), after: merge(b, keptB) }
}

const lines = (text: string): string[] => (text === '' ? [] : text.replace(/\r\n?/g, '\n').split('\n'))

/** Compara dois textos linha a linha. Textos grandes demais lançam erro. */
export function diffText(original: string, changed: string, options: DiffOptions): DiffResult {
  const a = lines(original)
  const b = lines(changed)
  if (a.length * b.length > MAX_CELLS) throw new Error('Os textos são grandes demais para comparar aqui. Compare por partes.')

  const pairs = commonPairs(a.map((line) => keyOf(line, options)), b.map((line) => keyOf(line, options)))
  const rows: Row[] = []
  let i = 0
  let j = 0
  const flush = (untilA: number, untilB: number) => {
    const removed: Row[] = []
    const added: Row[] = []
    for (; i < untilA; i++) removed.push({ type: 'remove', text: a[i], oldNumber: i + 1 })
    for (; j < untilB; j++) added.push({ type: 'add', text: b[j], newNumber: j + 1 })
    // Linhas trocadas ficam lado a lado (a 1ª removida com a 1ª nova...), com as palavras que mudaram marcadas.
    for (let k = 0; k < Math.min(removed.length, added.length); k++) {
      const words = wordDiff(removed[k].text, added[k].text, options)
      removed[k].parts = words.before
      added[k].parts = words.after
    }
    rows.push(...removed, ...added)
  }
  for (const [pairA, pairB] of pairs) {
    flush(pairA, pairB)
    rows.push({ type: 'equal', text: b[pairB], oldNumber: i + 1, newNumber: j + 1 })
    i++
    j++
  }
  flush(a.length, b.length)

  return {
    rows,
    added: rows.filter((row) => row.type === 'add').length,
    removed: rows.filter((row) => row.type === 'remove').length,
    equal: rows.filter((row) => row.type === 'equal').length,
  }
}

/** O resultado como texto: "+ nova", "- removida" e "  igual", como um diff simples. */
export const toUnified = (rows: readonly Row[]): string => rows.map((row) => `${row.type === 'add' ? '+' : row.type === 'remove' ? '-' : ' '} ${row.text}`).join('\n')
