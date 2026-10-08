import { describe, expect, it } from 'vitest'
import { colorIndex, fitLabel, labelSize, MAX_OPTIONS, MIN_OPTIONS, PALETTE, sliceCenter, slicePath, spinTarget, winnerAt } from '@/modules/wheel/lib/wheel'

describe('slicePath', () => {
  it('a primeira fatia de 4 vai do topo até a direita', () => {
    expect(slicePath(0, 4)).toBe('M 50 50 L 50.000 0.000 A 50 50 0 0 1 100.000 50.000 Z')
  })

  it('fatia maior que meia volta usa o arco grande', () => {
    expect(slicePath(0, 2).includes('A 50 50 0 0 1')).toBe(true)
    expect(slicePath(0, 1)).toContain('A 50 50 0 1 1')
  })

  it('as fatias fecham a roleta: o fim de uma é o começo da próxima', () => {
    for (const count of [3, 5, 7, 12]) {
      for (let index = 0; index < count; index++) {
        const end = /A [\d.]+ [\d.]+ 0 \d 1 ([\d.-]+) ([\d.-]+) Z/.exec(slicePath(index, count))!
        const next = /L ([\d.-]+) ([\d.-]+) A/.exec(slicePath((index + 1) % count, count))!
        expect(Number(end[1])).toBeCloseTo(Number(next[1]), 2)
        expect(Number(end[2])).toBeCloseTo(Number(next[2]), 2)
      }
    }
  })
})

describe('sliceCenter', () => {
  it('é o meio da fatia a partir do topo', () => {
    expect(sliceCenter(0, 4)).toBe(45)
    expect(sliceCenter(3, 4)).toBe(315)
    expect(sliceCenter(0, 2)).toBe(90)
  })
})

describe('winnerAt', () => {
  it('sem giro, o ponteiro (no topo) está na primeira fatia', () => {
    expect(winnerAt(0, 6)).toBe(0)
  })

  it('girar no sentido horário traz a fatia anterior para o ponteiro', () => {
    // Com 4 fatias, girar 90° leva a fatia 3 (a última) para o topo.
    expect(winnerAt(90, 4)).toBe(3)
    expect(winnerAt(180, 4)).toBe(2)
    expect(winnerAt(270, 4)).toBe(1)
    expect(winnerAt(360, 4)).toBe(0)
  })

  it('aceita ângulos negativos e acima de 360', () => {
    expect(winnerAt(-90, 4)).toBe(1)
    expect(winnerAt(450, 4)).toBe(3)
  })
})

describe('spinTarget', () => {
  it('para sempre na fatia sorteada, de qualquer ponto de partida e posição na fatia', () => {
    for (const count of [2, 3, 5, 8, 13, 24]) {
      for (const current of [0, 37.5, 359, 720, 1234.5, -90]) {
        for (let winner = 0; winner < count; winner++) {
          for (const where of [0, 0.25, 0.5, 0.99, 1]) {
            const target = spinTarget(current, winner, count, 5, where)
            expect(winnerAt(target, count)).toBe(winner)
          }
        }
      }
    }
  })

  it('dá pelo menos as voltas pedidas e nunca gira para trás', () => {
    for (const current of [0, 100, 500]) {
      const target = spinTarget(current, 3, 8, 5)
      expect(target - current).toBeGreaterThanOrEqual(5 * 360)
      expect(target - current).toBeLessThan(6 * 360)
    }
  })

  it('o ponteiro para longe da borda da fatia', () => {
    const count = 6
    for (const where of [0, 1]) {
      const target = spinTarget(0, 2, count, 3, where)
      const underPointer = ((-target % 360) + 360) % 360
      const inSlice = (underPointer - 2 * 60) / 60
      expect(inSlice).toBeGreaterThanOrEqual(0.1)
      expect(inSlice).toBeLessThanOrEqual(0.9)
    }
  })
})

describe('cores e rótulos', () => {
  it('fatias vizinhas têm cores diferentes, inclusive a última e a primeira', () => {
    for (let count = MIN_OPTIONS; count <= MAX_OPTIONS; count++) {
      for (let index = 0; index < count; index++) {
        const next = (index + 1) % count
        if (count > 1) expect(colorIndex(index, count)).not.toBe(colorIndex(next, count))
      }
    }
  })

  it('só usa cores da paleta', () => {
    for (let index = 0; index < 30; index++) expect(colorIndex(index, 30)).toBeLessThan(PALETTE.length)
  })

  it('corta rótulos grandes e normaliza espaços', () => {
    expect(fitLabel('  Pizza   de   calabresa com queijo  ')).toBe('Pizza de cala…')
    expect(fitLabel('Sushi')).toBe('Sushi')
  })

  it('a letra diminui com mais fatias', () => {
    expect(labelSize(4)).toBeGreaterThan(labelSize(10))
    expect(labelSize(10)).toBeGreaterThan(labelSize(24))
  })
})
