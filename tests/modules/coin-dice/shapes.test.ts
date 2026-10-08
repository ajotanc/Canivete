import { describe, expect, it } from 'vitest'
import { CUBE_FACES, cubeOrientation, pipCells, spinTo } from '@/modules/coin-dice/lib/shapes'

describe('pipCells', () => {
  it('cada face tem tantos pontos quanto o valor', () => {
    for (let value = 1; value <= 6; value++) expect(pipCells(value)).toHaveLength(value)
  })

  it('os pontos ficam dentro da grade 3×3 e não se repetem', () => {
    for (let value = 1; value <= 6; value++) {
      const cells = pipCells(value)
      expect(new Set(cells).size).toBe(cells.length)
      for (const cell of cells) {
        expect(cell).toBeGreaterThanOrEqual(1)
        expect(cell).toBeLessThanOrEqual(9)
      }
    }
  })

  it('valor fora de 1 a 6 não tem pontos', () => {
    expect(pipCells(0)).toEqual([])
    expect(pipCells(7)).toEqual([])
  })
})

describe('cubo', () => {
  it('tem as 6 faces e lados opostos somam 7', () => {
    expect(CUBE_FACES.map((face) => face.value).sort()).toEqual([1, 2, 3, 4, 5, 6])
    const place = (value: number) => CUBE_FACES.find((face) => face.value === value)?.place
    // Opostos usam giros que se anulam: 0/180 em Y e +90/-90 em X ou Y.
    expect([place(1), place(6)]).toEqual(['rotateY(0deg)', 'rotateY(180deg)'])
    expect([place(2), place(5)]).toEqual(['rotateY(90deg)', 'rotateY(-90deg)'])
    expect([place(3), place(4)]).toEqual(['rotateX(90deg)', 'rotateX(-90deg)'])
  })

  it('a orientação desfaz o giro da face: face + orientação voltam ao centro', () => {
    for (const face of CUBE_FACES) {
      const { x, y } = cubeOrientation(face.value)
      const placeX = /rotateX\((-?\d+)deg\)/.exec(face.place)?.[1]
      const placeY = /rotateY\((-?\d+)deg\)/.exec(face.place)?.[1]
      // A face fica em (placeX, placeY); o cubo gira o contrário para trazê-la à frente.
      expect(((Number(placeX ?? 0) + x) % 360 + 360) % 360).toBe(0)
      expect(((Number(placeY ?? 0) + y) % 360 + 360) % 360).toBe(0)
    }
  })

  it('valor desconhecido fica de frente no 1', () => {
    expect(cubeOrientation(9)).toEqual({ x: 0, y: 0 })
  })
})

describe('spinTo', () => {
  it('cai na orientação pedida e sempre gira para frente', () => {
    for (const current of [0, 90, 180, 270, 450, 725, -90]) {
      for (const base of [0, 90, -90, 180]) {
        const next = spinTo(current, base)
        expect((((next - base) % 360) + 360) % 360).toBe(0)
        expect(next - current).toBeGreaterThanOrEqual(720)
        expect(next - current).toBeLessThan(720 + 360)
      }
    }
  })
})
