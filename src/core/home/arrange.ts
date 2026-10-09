import { CATEGORIES, categoryKey, type CategoryKey } from '@/core/modules/categories'

/** Ordem da home: aleatória (sorteada a cada visita), de A a Z ou de Z a A. */
export type SortMode = 'random' | 'az' | 'za'
export const SORT_MODES: readonly SortMode[] = ['random', 'az', 'za']

interface Named {
  id: string
  title: string
  category: string
}

const byTitle = (a: Named, b: Named) => a.title.localeCompare(b.title, 'pt-BR')

/**
 * Ordena a lista. Na aleatória vale a posição em `randomOrder` (ids sorteados uma vez por visita),
 * para a ordem não mudar enquanto a pessoa favorita ou agrupa.
 */
export function arrange<T extends Named>(list: readonly T[], mode: SortMode, randomOrder: readonly string[]): T[] {
  if (mode === 'az') return [...list].sort(byTitle)
  if (mode === 'za') return [...list].sort((a, b) => byTitle(b, a))
  const position = new Map(randomOrder.map((id, index) => [id, index]))
  return [...list].sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0))
}

export interface CategoryGroup<T> {
  key: CategoryKey | 'other'
  name: string
  tools: T[]
}

/**
 * Separa por categoria. As categorias seguem a mesma ordem pedida (pelo nome, ou na ordem sorteada em
 * `randomCategories`), e as ferramentas dentro de cada uma também. Categoria sem ferramenta não aparece.
 */
export function groupByCategory<T extends Named>(
  list: readonly T[],
  mode: SortMode,
  randomOrder: readonly string[],
  randomCategories: readonly string[],
): CategoryGroup<T>[] {
  const groups = CATEGORIES.map((category) => ({
    key: category.key,
    name: category.name,
    tools: arrange(list.filter((tool) => categoryKey(tool.category) === category.key), mode, randomOrder),
  })).filter((group) => group.tools.length > 0)
  return arrange(
    groups.map((group) => ({ ...group, id: group.key, title: group.name, category: group.name })),
    mode,
    randomCategories,
  ).map(({ key, name, tools }) => ({ key, name, tools }))
}
