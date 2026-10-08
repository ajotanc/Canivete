import { describe, expect, it } from 'vitest'
import { compareFuel } from '@/modules/fuel/lib/fuel'

describe('compareFuel pela regra dos 70%', () => {
  it('etanol compensa abaixo de 70%', () => {
    const result = compareFuel({ gasoline: 6, ethanol: 4 })
    expect(result.ratio).toBeCloseTo(0.6667, 4)
    expect(result).toMatchObject({ breakEven: 0.7, usesConsumption: false, winner: 'ethanol', costPerKm: null, trip: null, savingPercent: null })
  })

  it('gasolina compensa acima de 70%', () => {
    expect(compareFuel({ gasoline: 6, ethanol: 4.5 }).winner).toBe('gasoline')
  })

  it('exatamente 70% é empate', () => {
    expect(compareFuel({ gasoline: 10, ethanol: 7 }).winner).toBe('tie')
  })

  it('consumo de um só não basta: continua na regra dos 70%', () => {
    expect(compareFuel({ gasoline: 6, ethanol: 4, gasolineKmL: 12 }).usesConsumption).toBe(false)
  })
})

describe('compareFuel com o consumo do carro', () => {
  it('usa o rendimento relativo como ponto de equilíbrio', () => {
    // etanol rende 8, gasolina 12: ponto de equilíbrio 0,667.
    const result = compareFuel({ gasoline: 6, ethanol: 4.2, gasolineKmL: 12, ethanolKmL: 8 })
    expect(result.usesConsumption).toBe(true)
    expect(result.breakEven).toBeCloseTo(0.6667, 4)
    expect(result.winner).toBe('gasoline')
    expect(result.costPerKm?.gasoline).toBeCloseTo(0.5, 6)
    expect(result.costPerKm?.ethanol).toBeCloseTo(0.525, 6)
    expect(result.savingPercent).toBeCloseTo(4.76, 1)
  })

  it('calcula o custo da viagem', () => {
    const result = compareFuel({ gasoline: 6, ethanol: 4, gasolineKmL: 12, ethanolKmL: 8, distanceKm: 200 })
    expect(result.trip?.gasoline).toBeCloseTo(100, 6)
    expect(result.trip?.ethanol).toBeCloseTo(100, 6)
    expect(result.winner).toBe('tie')
  })

  it('sem distância não há viagem', () => {
    expect(compareFuel({ gasoline: 6, ethanol: 4, gasolineKmL: 12, ethanolKmL: 8, distanceKm: 0 }).trip).toBeNull()
  })
})

describe('validação', () => {
  it('preço zero, negativo ou ausente lança erro', () => {
    expect(() => compareFuel({ gasoline: 0, ethanol: 4 })).toThrow('preços')
    expect(() => compareFuel({ gasoline: 6, ethanol: -1 })).toThrow('preços')
    expect(() => compareFuel({ gasoline: Number.NaN, ethanol: 4 })).toThrow('preços')
  })
})
