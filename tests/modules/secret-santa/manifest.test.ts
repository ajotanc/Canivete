import { describe, expect, it } from 'vitest'
import { tools } from '@/core/modules/registry'

describe('módulo secret-santa', () => {
  const santa = tools.find((tool) => tool.id === 'secret-santa')

  it('é descoberto automaticamente pelo registro', () => {
    expect(santa).toBeDefined()
    expect(santa?.title).toBe('Amigo secreto')
    expect(santa?.usesBackend).toBe(true)
    expect(santa?.category).toBe('Sorteios')
  })

  it('expõe as quatro rotas com o prefixo correto', () => {
    expect(santa?.routes.map((route) => route.path)).toEqual([
      '/secret-santa',
      '/secret-santa/g/:id/:slug?',
      '/secret-santa/g/:id/me',
      '/secret-santa/g/:id/admin',
    ])
  })

  it('convive com o módulo raffle sem ids repetidos', () => {
    const ids = tools.map((tool) => tool.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('raffle')
  })
})
