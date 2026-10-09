import { describe, expect, it } from 'vitest'
import { formatMoney, maskMoney, parseMoney } from '@/lib/money'

const nbsp = (text: string) => text.replace(/ /g, ' ')

describe('formatMoney', () => {
  it('formata em reais e devolve vazio sem valor', () => {
    expect(nbsp(formatMoney(50))).toBe('R$ 50,00')
    expect(nbsp(formatMoney(1234.5))).toBe('R$ 1.234,50')
    expect(formatMoney(null)).toBe('')
    expect(formatMoney(Number.NaN)).toBe('')
  })
})

describe('parseMoney', () => {
  it('converte o texto digitado para o valor do banco', () => {
    expect(parseMoney('R$ 1.234,56')).toBe(1234.56)
    expect(parseMoney('5000')).toBe(50)
    expect(parseMoney('R$ 0,05')).toBe(0.05)
  })

  it('devolve null sem dígitos', () => {
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('R$ ')).toBeNull()
    expect(parseMoney(null)).toBeNull()
  })
})

describe('maskMoney', () => {
  it('vai preenchendo da direita para a esquerda', () => {
    expect(nbsp(maskMoney('5'))).toBe('R$ 0,05')
    expect(nbsp(maskMoney('R$ 0,055'))).toBe('R$ 0,55')
    expect(nbsp(maskMoney('R$ 0,555'))).toBe('R$ 5,55')
    expect(maskMoney('abc')).toBe('')
  })

  it('usa o símbolo da moeda pedida, sempre com 2 casas', () => {
    expect(nbsp(maskMoney('R$ 10,00', 'USD'))).toBe('US$ 10,00')
    expect(nbsp(maskMoney('US$ 10,00', 'EUR'))).toBe('€ 10,00')
    expect(nbsp(maskMoney('1000', 'JPY'))).toBe('JP¥ 10,00')
    expect(parseMoney(maskMoney('1234', 'CAD'))).toBe(12.34)
  })
})
