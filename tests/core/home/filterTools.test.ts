import { describe, expect, it } from 'vitest'
import type { ToolManifest } from '@/core/modules/types'
import { filterTools } from '@/core/home/filterTools'

const icon = {} as ToolManifest['icon']
const base = { icon, usesBackend: false, routes: [] }

const tools: ToolManifest[] = [
  { ...base, id: 'raffle', title: 'Sorteador de nomes', description: 'Sorteie pessoas', category: 'Sorteios' },
  { ...base, id: 'timer', title: 'Cronômetro', description: 'Conte o tempo', category: 'Tempo' },
]

describe('filterTools', () => {
  it('sem filtros devolve tudo', () => {
    expect(filterTools(tools, '', null)).toHaveLength(2)
  })

  it('busca ignora acento e maiúsculas', () => {
    expect(filterTools(tools, 'CRONOMETRO', null).map((t) => t.id)).toEqual(['timer'])
  })

  it('busca também na descrição', () => {
    expect(filterTools(tools, 'pessoas', null).map((t) => t.id)).toEqual(['raffle'])
  })

  it('filtra por categoria', () => {
    expect(filterTools(tools, '', 'Tempo').map((t) => t.id)).toEqual(['timer'])
  })

  it('combina busca e categoria', () => {
    expect(filterTools(tools, 'sorteador', 'Tempo')).toEqual([])
  })

  it('ignora espaços nas pontas da busca', () => {
    expect(filterTools(tools, '  sorteador  ', null)).toHaveLength(1)
  })
})
