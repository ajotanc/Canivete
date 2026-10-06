import { describe, expect, it } from 'vitest'
import { buildRegistry } from '@/core/modules/registry'
import { tools } from '@/core/modules/registry'

describe('módulo raffle', () => {
  it('é descoberto automaticamente pelo registro', () => {
    const raffle = tools.find((tool) => tool.id === 'raffle')
    expect(raffle).toBeDefined()
    expect(raffle?.usesBackend).toBe(true)
    expect(raffle?.title).toBe('Sorteador de nomes')
  })

  it('expõe as rotas /raffle e /raffle/r/:id com o prefixo correto', () => {
    const raffle = tools.find((tool) => tool.id === 'raffle')
    expect(raffle?.routes.map((route) => route.path)).toEqual(['/raffle', '/raffle/r/:id'])
  })

  it('passa na validação do registro', () => {
    const raffle = tools.find((tool) => tool.id === 'raffle')!
    expect(() => buildRegistry({ '/src/modules/raffle/manifest.ts': { default: raffle } })).not.toThrow()
  })
})
