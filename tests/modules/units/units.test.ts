import { describe, expect, it } from 'vitest'
import { CATEGORIES, convert, findCategory, formatQuantity } from '@/modules/units/lib/units'

describe('convert', () => {
  it('comprimento', () => {
    expect(convert(1, 'length', 'km', 'm')).toBe(1000)
    expect(convert(1, 'length', 'mi', 'km')).toBeCloseTo(1.609344, 6)
    expect(convert(12, 'length', 'in', 'ft')).toBeCloseTo(1, 10)
  })

  it('peso, volume e área', () => {
    expect(convert(1, 'mass', 'lb', 'g')).toBeCloseTo(453.59237, 5)
    expect(convert(1, 'volume', 'cup', 'ml')).toBeCloseTo(240, 8)
    expect(convert(1, 'area', 'ha', 'm2')).toBe(10_000)
  })

  it('velocidade e tempo', () => {
    expect(convert(36, 'speed', 'kmh', 'ms')).toBeCloseTo(10, 10)
    expect(convert(1, 'speed', 'kn', 'kmh')).toBeCloseTo(1.852, 10)
    expect(convert(2, 'time', 'd', 'h')).toBe(48)
  })

  it('dados: decimal e binário são diferentes', () => {
    expect(convert(1, 'data', 'kb', 'b')).toBe(1000)
    expect(convert(1, 'data', 'kib', 'b')).toBe(1024)
    expect(convert(1, 'data', 'gib', 'mib')).toBe(1024)
  })

  it('temperatura', () => {
    expect(convert(0, 'temperature', 'c', 'f')).toBe(32)
    expect(convert(100, 'temperature', 'c', 'k')).toBe(373.15)
    expect(convert(212, 'temperature', 'f', 'c')).toBe(100)
    expect(convert(-40, 'temperature', 'c', 'f')).toBe(-40)
    expect(convert(0, 'temperature', 'k', 'c')).toBe(-273.15)
  })

  it('mesma unidade devolve o mesmo valor', () => {
    for (const category of CATEGORIES) for (const unit of category.units) expect(convert(7.5, category.id, unit.id, unit.id)).toBeCloseTo(7.5, 10)
  })

  it('unidade ou categoria desconhecida lança erro', () => {
    expect(() => convert(1, 'length', 'm', 'xx')).toThrow('Unidade desconhecida')
    expect(() => convert(1, 'nada', 'm', 'm')).toThrow('Unidade desconhecida')
  })
})

describe('catálogo', () => {
  it('tem ids únicos em cada categoria', () => {
    expect(new Set(CATEGORIES.map((category) => category.id)).size).toBe(CATEGORIES.length)
    for (const category of CATEGORIES) expect(new Set(category.units.map((unit) => unit.id)).size).toBe(category.units.length)
  })

  it('acha categoria por id', () => {
    expect(findCategory('mass')?.label).toBe('Peso')
    expect(findCategory('x')).toBeUndefined()
  })
})

describe('formatQuantity', () => {
  it('limita os algarismos significativos', () => {
    expect(formatQuantity(1.609344)).toBe('1,60934')
    expect(formatQuantity(1000)).toBe('1.000')
    expect(formatQuantity(0)).toBe('0')
  })

  it('usa notação científica nos extremos', () => {
    expect(formatQuantity(1.5e13)).toBe('1,5000e+13')
    expect(formatQuantity(0.0000005)).toBe('5,0000e-7')
  })

  it('valor inválido vira vazio', () => {
    expect(formatQuantity(Number.NaN)).toBe('')
  })
})
