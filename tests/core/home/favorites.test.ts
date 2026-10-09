// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { favorites, isFavorite, toggleFavorite } from '@/core/home/favorites'

describe('favoritas', () => {
  beforeEach(() => {
    favorites.value = []
  })

  it('liga e desliga, guardando no navegador', async () => {
    expect(toggleFavorite('wheel')).toBe(true)
    expect(isFavorite('wheel')).toBe(true)
    await Promise.resolve()
    expect(JSON.parse(localStorage.getItem('canivete:favorites') ?? '[]')).toEqual(['wheel'])
    expect(toggleFavorite('wheel')).toBe(false)
    expect(isFavorite('wheel')).toBe(false)
  })

  it('mantém a ordem em que a pessoa favoritou', () => {
    toggleFavorite('timer')
    toggleFavorite('cep')
    expect(favorites.value).toEqual(['timer', 'cep'])
  })
})
