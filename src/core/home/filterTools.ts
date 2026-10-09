import type { ToolManifest } from '@/core/modules/types'

/** Remove acentos e converte para minúsculas, para comparar textos em pt-BR. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Palavras da busca, já normalizadas. */
export const queryWords = (query: string): string[] => normalize(query).split(/\s+/).filter(Boolean)

/** Todas as palavras aparecem no texto (em qualquer ordem, em qualquer parte de uma palavra): "calc horas" acha "Calculadora de horas". */
export const matchesWords = (text: string, words: readonly string[]): boolean => {
  const haystack = normalize(text)
  return words.every((word) => haystack.includes(word))
}

/**
 * Filtra as ferramentas por texto (título, descrição e categoria) e por categoria.
 * Quem casa pelo título vem primeiro; o resto segue a ordem original.
 */
export function filterTools(
  tools: ToolManifest[],
  query: string,
  category: string | null,
): ToolManifest[] {
  const words = queryWords(query)
  const found = tools.filter((tool) => {
    if (category && tool.category !== category) return false
    return words.length === 0 || matchesWords(`${tool.title} ${tool.description} ${tool.category}`, words)
  })
  if (words.length === 0) return found
  const byTitle = found.filter((tool) => matchesWords(tool.title, words))
  return [...byTitle, ...found.filter((tool) => !byTitle.includes(tool))]
}
