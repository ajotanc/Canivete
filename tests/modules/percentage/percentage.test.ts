import { describe, expect, it } from 'vitest'
import {
  applyDiscount,
  applyIncrease,
  compoundInterest,
  formatBrl,
  formatNumber,
  formatPercent,
  parseDecimal,
  percentChange,
  percentOf,
  simpleInterest,
  whatPercent,
} from '@/modules/percentage/lib/percentage'

describe('parseDecimal', () => {
  it('entende o formato brasileiro', () => {
    expect(parseDecimal('1.234,56')).toBe(1234.56)
    expect(parseDecimal('12,5')).toBe(12.5)
    expect(parseDecimal('R$ 10')).toBe(10)
    expect(parseDecimal('15%')).toBe(15)
    expect(parseDecimal('-3,2')).toBe(-3.2)
  })

  it('ponto sozinho é decimal, menos em milhares', () => {
    expect(parseDecimal('12.5')).toBe(12.5)
    expect(parseDecimal('1.234')).toBe(1234)
    expect(parseDecimal('1.234.567')).toBe(1234567)
  })

  it('texto vazio ou inválido vira null', () => {
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('1,2,3')).toBeNull()
    expect(parseDecimal(',')).toBeNull()
  })
})

describe('cálculos', () => {
  it('quanto é X% de Y', () => {
    expect(percentOf(15, 200)).toBe(30)
  })

  it('quantos % um valor é de outro', () => {
    expect(whatPercent(30, 200)).toBe(15)
    expect(whatPercent(1, 0)).toBeNull()
  })

  it('variação percentual', () => {
    expect(percentChange(100, 150)).toBe(50)
    expect(percentChange(200, 150)).toBe(-25)
    expect(percentChange(0, 10)).toBeNull()
  })

  it('desconto e acréscimo', () => {
    expect(applyDiscount(80, 25)).toEqual({ final: 60, difference: 20 })
    expect(applyIncrease(80, 25)).toEqual({ final: 100, difference: 20 })
  })

  it('juros simples e compostos', () => {
    expect(simpleInterest(1000, 2, 12)).toEqual({ interest: 240, total: 1240 })
    const compound = compoundInterest(1000, 10, 2)
    expect(compound.total).toBeCloseTo(1210, 6)
    expect(compound.interest).toBeCloseTo(210, 6)
  })
})

describe('formatação', () => {
  it('formata número, percentual e real', () => {
    expect(formatNumber(1234.5)).toBe('1.234,5')
    expect(formatPercent(12.345)).toBe('12,35%')
    expect(formatBrl(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50')
  })
})
