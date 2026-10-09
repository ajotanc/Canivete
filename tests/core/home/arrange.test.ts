import { describe, expect, it } from 'vitest'
import { arrange, groupByCategory } from '@/core/home/arrange'

const tool = (id: string, title: string, category: string) => ({ id, title, category })
const list = [
  tool('wheel', 'Roleta', 'Sorteios'),
  tool('cep', 'Consulta de CEP', 'Utilidades'),
  tool('json', 'Formatador de JSON', 'Desenvolvimento'),
  tool('raffle', 'Sorteador de nomes', 'Sorteios'),
  tool('hours', 'Calculadora de horas', 'Calculadoras'),
]
const ids = (items: { id: string }[]) => items.map((item) => item.id)

describe('arrange', () => {
  it('ordena de A a Z e de Z a A pelo título', () => {
    expect(ids(arrange(list, 'az', []))).toEqual(['hours', 'cep', 'json', 'wheel', 'raffle'])
    expect(ids(arrange(list, 'za', []))).toEqual(['raffle', 'wheel', 'json', 'cep', 'hours'])
  })

  it('na aleatória segue a ordem sorteada, sem mudar a lista original', () => {
    const order = ['json', 'raffle', 'cep', 'hours', 'wheel']
    expect(ids(arrange(list, 'random', order))).toEqual(order)
    expect(list[0].id).toBe('wheel')
  })
})

describe('groupByCategory', () => {
  it('agrupa e ordena categorias e ferramentas na ordem pedida', () => {
    const groups = groupByCategory(list, 'az', [], [])
    expect(groups.map((group) => group.name)).toEqual(['Calculadoras', 'Desenvolvimento', 'Sorteios', 'Utilidades'])
    expect(ids(groups.find((group) => group.name === 'Sorteios')!.tools)).toEqual(['wheel', 'raffle'])
    expect(groupByCategory(list, 'za', [], []).map((group) => group.name)).toEqual(['Utilidades', 'Sorteios', 'Desenvolvimento', 'Calculadoras'])
  })

  it('na aleatória usa a ordem sorteada das categorias e não mostra categoria vazia', () => {
    const groups = groupByCategory(list, 'random', ['raffle', 'wheel'], ['utilities', 'draws', 'calculators', 'development', 'text'])
    expect(groups.map((group) => group.key)).toEqual(['utilities', 'draws', 'calculators', 'development'])
    expect(ids(groups[1].tools)).toEqual(['raffle', 'wheel'])
  })
})
