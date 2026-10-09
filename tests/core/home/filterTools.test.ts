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

  it('acha por palavras soltas, em qualquer ordem e pedaço', () => {
    expect(filterTools(tools, 'nomes sort', null).map((t) => t.id)).toEqual(['raffle'])
    expect(filterTools(tools, 'sort tempo', null)).toEqual([])
  })

  it('busca também na categoria', () => {
    expect(filterTools(tools, 'tempo', null).map((t) => t.id)).toEqual(['timer'])
  })

  it('põe primeiro quem casa pelo título', () => {
    const list: ToolManifest[] = [
      { ...base, id: 'a', title: 'Contador de texto', description: 'Conte o tempo de leitura', category: 'Texto' },
      { ...base, id: 'b', title: 'Cronômetro e tempo', description: 'Marque voltas', category: 'Tempo' },
    ]
    expect(filterTools(list, 'tempo', null).map((t) => t.id)).toEqual(['b', 'a'])
  })
})
