import { describe, expect, it } from 'vitest'
import { splitBill, splitMessage } from '@/modules/split-bill/lib/split'

describe('splitBill', () => {
  it('divide a conta exata', () => {
    expect(splitBill({ billCents: 10_000, people: 4, tipPercent: 0, roundUp: false })).toMatchObject({ tipCents: 0, totalCents: 10_000, shareCents: 2500, higherCount: 0, collectedCents: 10_000, surplusCents: 0 })
  })

  it('soma a gorjeta antes de dividir', () => {
    const result = splitBill({ billCents: 20_000, people: 4, tipPercent: 10, roundUp: false })
    expect(result.tipCents).toBe(2000)
    expect(result.totalCents).toBe(22_000)
    expect(result.shareCents).toBe(5500)
  })

  it('a sobra de centavos vai para algumas pessoas e a soma fecha exata', () => {
    const result = splitBill({ billCents: 10_000, people: 3, tipPercent: 0, roundUp: false })
    expect(result.shareCents).toBe(3333)
    expect(result.higherCount).toBe(1)
    expect(result.shareCents * 3 + result.higherCount).toBe(10_000)
  })

  it('arredonda para reais inteiros e mostra a sobra', () => {
    const result = splitBill({ billCents: 10_000, people: 3, tipPercent: 0, roundUp: true })
    expect(result.shareCents).toBe(3400)
    expect(result.collectedCents).toBe(10_200)
    expect(result.surplusCents).toBe(200)
  })

  it('uma pessoa só paga tudo; zero ou negativo vira uma pessoa', () => {
    expect(splitBill({ billCents: 5000, people: 1, tipPercent: 0, roundUp: false }).shareCents).toBe(5000)
    expect(splitBill({ billCents: 5000, people: 0, tipPercent: 0, roundUp: false }).shareCents).toBe(5000)
  })

  it('gorjeta negativa é ignorada e a gorjeta arredonda ao centavo', () => {
    expect(splitBill({ billCents: 1000, people: 2, tipPercent: -5, roundUp: false }).tipCents).toBe(0)
    expect(splitBill({ billCents: 1001, people: 1, tipPercent: 10, roundUp: false }).tipCents).toBe(100)
  })
})

describe('splitMessage', () => {
  const norm = (text: string) => text.replace(/[  ]/g, ' ')

  it('monta o texto com gorjeta', () => {
    const result = splitBill({ billCents: 20_000, people: 4, tipPercent: 10, roundUp: false })
    expect(norm(splitMessage(result, 4, 10))).toBe('Conta: R$ 200,00 + 10% de gorjeta (R$ 20,00) = R$ 220,00\nPara 4 pessoas: R$ 55,00 cada.')
  })

  it('explica quem paga 1 centavo a mais', () => {
    const result = splitBill({ billCents: 10_000, people: 3, tipPercent: 0, roundUp: false })
    expect(norm(splitMessage(result, 3, 0))).toContain('2 pagam R$ 33,33 e 1 pagam R$ 33,34')
  })

  it('avisa a sobra do arredondamento', () => {
    const result = splitBill({ billCents: 10_000, people: 3, tipPercent: 0, roundUp: true })
    expect(norm(splitMessage(result, 3, 0))).toContain('Sobram R$ 2,00')
  })
})
