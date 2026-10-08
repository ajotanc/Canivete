export type ParseResult = { ok: true; value: unknown } | { ok: false; message: string; line: number; column: number }

/** Linha e coluna (a partir de 1) de uma posição do texto. */
export function locate(text: string, position: number): { line: number; column: number } {
  const before = text.slice(0, Math.max(0, Math.min(position, text.length)))
  const lines = before.split('\n')
  return { line: lines.length, column: lines[lines.length - 1].length + 1 }
}

/** Lê o JSON; se for inválido, diz em português onde está o erro. */
export function parseJson(text: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (cause) {
    const raw = cause instanceof Error ? cause.message : ''
    const position = /position (\d+)/.exec(raw)
    const lineColumn = /line (\d+) column (\d+)/.exec(raw)
    let line = 1
    let column = 1
    const fromSnippet = position || lineColumn ? null : positionFromSnippet(raw, text)
    if (lineColumn) {
      line = Number(lineColumn[1])
      column = Number(lineColumn[2])
    } else if (position) {
      ;({ line, column } = locate(text, Number(position[1])))
    } else if (fromSnippet !== null) {
      ;({ line, column } = locate(text, fromSnippet))
    } else if (text.trim() !== '') {
      // Fim inesperado do texto: aponta para o último caractere.
      ;({ line, column } = locate(text, text.length))
    }
    const trimmed = text.trim()
    const atEnd = position !== null && Number(position[1]) >= text.trimEnd().length
    const message = trimmed === '' ? 'O texto está vazio.' : explain(raw, trimmed, atEnd)
    return { ok: false, message, line, column }
  }
}

/** Número de caracteres que o motor mostra antes do erro quando recorta o trecho da mensagem. */
const SNIPPET_CONTEXT = 10

/**
 * Algumas mensagens não trazem a posição, só um trecho do texto ("Unexpected token ',', ..."1,\n "b": ,"... is not valid JSON").
 * Acha o trecho no texto e devolve a posição do caractere do erro, ou `null` se não achar.
 */
function positionFromSnippet(raw: string, text: string): number | null {
  const match = /Unexpected token '([\s\S]*?)', (\.\.\.)?"([\s\S]*)"(\.\.\.)? is not valid JSON/.exec(raw)
  if (!match) return null
  const [, token, leading, snippet] = match
  const start = text.indexOf(snippet)
  if (start < 0) return null
  const offset = leading ? SNIPPET_CONTEXT : Math.max(0, snippet.indexOf(token))
  return start + offset
}

function explain(raw: string, text: string, atEnd: boolean): string {
  if (atEnd || /end of JSON|unexpected end/i.test(raw)) return 'O JSON termina antes da hora: falta fechar uma chave, colchete ou aspas.'
  if (/single quote|property name/i.test(raw) || /Expected double-quoted/i.test(raw)) return 'Os nomes e textos precisam de aspas duplas ("), e o último item não pode ter vírgula sobrando.'
  if (/Unexpected token/i.test(raw) && /^[{[]/.test(text) === false) return 'Um JSON começa com { ou [, ou com um texto, número, true, false ou null.'
  if (/Unexpected token/i.test(raw) || /Expected/i.test(raw)) return 'Há um caractere fora do lugar (vírgula, dois-pontos, aspas ou chave).'
  return 'O texto não é um JSON válido.'
}

export type Indent = 2 | 4 | 'tab'

export function formatJson(value: unknown, indent: Indent): string {
  return JSON.stringify(value, null, indent === 'tab' ? '\t' : indent)
}

export const minifyJson = (value: unknown): string => JSON.stringify(value)

/** Cópia com as chaves de todos os objetos em ordem alfabética (listas mantêm a ordem). */
export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
    )
  }
  return value
}

export interface JsonStats {
  type: 'objeto' | 'lista' | 'texto' | 'número' | 'booleano' | 'nulo'
  keys: number
  depth: number
  bytes: number
}

function typeOf(value: unknown): JsonStats['type'] {
  if (Array.isArray(value)) return 'lista'
  if (value === null) return 'nulo'
  if (typeof value === 'object') return 'objeto'
  if (typeof value === 'string') return 'texto'
  if (typeof value === 'number') return 'número'
  return 'booleano'
}

/** Total de chaves de objeto, profundidade de aninhamento e tamanho do JSON minificado em bytes (UTF-8). */
export function statsOf(value: unknown): JsonStats {
  let keys = 0
  const depthOf = (item: unknown): number => {
    if (Array.isArray(item)) return 1 + Math.max(0, ...item.map(depthOf))
    if (item !== null && typeof item === 'object') {
      const entries = Object.values(item)
      keys += entries.length
      return 1 + Math.max(0, ...entries.map(depthOf))
    }
    return 0
  }
  const depth = depthOf(value)
  return { type: typeOf(value), keys, depth, bytes: new TextEncoder().encode(minifyJson(value)).length }
}
