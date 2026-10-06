import { describe, expect, it } from 'vitest'
import type { ToolManifest } from './types'
import { buildRegistry } from './registry'

const dummyIcon = {} as ToolManifest['icon']

function makeManifest(overrides: Partial<ToolManifest> = {}): ToolManifest {
  return {
    id: 'alpha',
    title: 'Alfa',
    description: 'Ferramenta de teste',
    icon: dummyIcon,
    category: 'Teste',
    usesBackend: false,
    routes: [{ path: '/alpha', component: {} }],
    ...overrides,
  }
}

describe('buildRegistry', () => {
  it('ordena os módulos por título em pt-BR', () => {
    const result = buildRegistry({
      '/src/modules/b/manifest.ts': { default: makeManifest({ id: 'b', title: 'Zebra', routes: [{ path: '/b', component: {} }] }) },
      '/src/modules/a/manifest.ts': { default: makeManifest({ id: 'a', title: 'Árvore', routes: [{ path: '/a', component: {} }] }) },
    })
    expect(result.map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('rejeita ids duplicados', () => {
    expect(() =>
      buildRegistry({
        '/src/modules/a/manifest.ts': { default: makeManifest() },
        '/src/modules/b/manifest.ts': { default: makeManifest() },
      }),
    ).toThrow(/duplicado/i)
  })

  it('rejeita manifest sem id', () => {
    expect(() =>
      buildRegistry({ '/src/modules/a/manifest.ts': { default: makeManifest({ id: '' }) } }),
    ).toThrow(/inválido/i)
  })

  it('rejeita rotas fora do prefixo /<id>', () => {
    expect(() =>
      buildRegistry({
        '/src/modules/a/manifest.ts': { default: makeManifest({ routes: [{ path: '/outro', component: {} }] }) },
      }),
    ).toThrow(/prefixo/i)
  })

  it('aceita a rota raiz e subrotas do módulo', () => {
    const result = buildRegistry({
      '/src/modules/a/manifest.ts': {
        default: makeManifest({
          routes: [
            { path: '/alpha', component: {} },
            { path: '/alpha/r/:id', component: {} },
          ],
        }),
      },
    })
    expect(result).toHaveLength(1)
  })
})
