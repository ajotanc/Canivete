import { MAX_NAME_LENGTH, MAX_NAMES } from '../constants'

export interface ParsedNames {
  /** Nomes normalizados, na ordem digitada (duplicados preservados). */
  names: string[]
  /** Nomes que aparecem mais de uma vez (sem diferenciar maiúsculas), na primeira forma vista. */
  duplicates: string[]
  /** Nomes acima de MAX_NAME_LENGTH caracteres. */
  tooLong: string[]
  /** True se há mais de MAX_NAMES nomes. */
  tooMany: boolean
}

/** Converte o texto bruto (um nome por linha) em uma lista normalizada e diagnósticos. */
export function parseNames(raw: string): ParsedNames {
  const names = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const counts = new Map<string, { first: string; count: number }>()
  for (const name of names) {
    const key = name.toLocaleLowerCase('pt-BR')
    const entry = counts.get(key)
    if (entry) entry.count += 1
    else counts.set(key, { first: name, count: 1 })
  }

  return {
    names,
    duplicates: [...counts.values()].filter((e) => e.count > 1).map((e) => e.first),
    tooLong: names.filter((name) => name.length > MAX_NAME_LENGTH),
    tooMany: names.length > MAX_NAMES,
  }
}

/** Devolve uma mensagem em português se a lista não puder ser sorteada; senão, null. */
export function validateNames(parsed: ParsedNames): string | null {
  if (parsed.names.length === 0) return 'Adicione pelo menos um nome.'
  if (parsed.tooMany) return 'O limite é de 1.000 nomes por sorteio.'
  if (parsed.tooLong.length > 0) return `Cada nome pode ter no máximo ${MAX_NAME_LENGTH} caracteres.`
  return null
}

/**
 * Remove do texto bruto uma ocorrência de cada nome informado.
 * Usado no modo "sem repetição" para tirar os vencedores da lista.
 */
export function removeNames(raw: string, toRemove: string[]): string {
  const lines = raw.split(/\r?\n/)
  for (const name of toRemove) {
    const index = lines.findIndex((line) => line.trim() === name)
    if (index !== -1) lines.splice(index, 1)
  }
  return lines.join('\n')
}
