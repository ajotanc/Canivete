import type { ToolManifest } from '@/core/modules/types'

/** Remove acentos e converte para minúsculas, para comparar textos em pt-BR. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

/** Filtra as ferramentas por texto (título e descrição) e por categoria. */
export function filterTools(
  tools: ToolManifest[],
  query: string,
  category: string | null,
): ToolManifest[] {
  const q = normalize(query)
  return tools.filter((tool) => {
    if (category && tool.category !== category) return false
    if (!q) return true
    return normalize(`${tool.title} ${tool.description}`).includes(q)
  })
}
