import { useStorage } from '@vueuse/core'

/**
 * Ferramentas favoritas (ids), guardadas só neste navegador. Aparecem antes das outras na home e na busca.
 * A ordem é a de quando a pessoa favoritou; a home mostra em ordem alfabética.
 */
export const favorites = useStorage<string[]>('canivete:favorites', [])

export const isFavorite = (id: string): boolean => favorites.value.includes(id)

/** Liga ou desliga a favorita; devolve se ela ficou favorita. */
export function toggleFavorite(id: string): boolean {
  const on = !isFavorite(id)
  favorites.value = on ? [...favorites.value, id] : favorites.value.filter((item) => item !== id)
  return on
}
