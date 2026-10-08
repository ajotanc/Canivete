/** Geometria do cubo (d6): pontos de cada face, posição das faces e giro que traz cada uma para a frente. Os outros dados estão em `polyhedra.ts`. */

/** Casas ocupadas por pontos num dado de 6, numa grade 3×3 numerada de 1 a 9 (linha por linha). */
const PIPS: Record<number, readonly number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
}

export const pipCells = (value: number): readonly number[] => PIPS[value] ?? []

/** Faces do cubo: lados opostos somam 7 (1–6, 2–5, 3–4), como num dado de verdade. */
export interface CubeFace {
  value: number
  /** Transformação CSS que leva a face do centro do cubo para o lugar dela (a distância vem de fora). */
  place: string
}

export const CUBE_FACES: readonly CubeFace[] = [
  { value: 1, place: 'rotateY(0deg)' },
  { value: 6, place: 'rotateY(180deg)' },
  { value: 2, place: 'rotateY(90deg)' },
  { value: 5, place: 'rotateY(-90deg)' },
  { value: 3, place: 'rotateX(90deg)' },
  { value: 4, place: 'rotateX(-90deg)' },
]

/** Giro do cubo, em graus, que deixa a face `value` virada para quem olha. */
export function cubeOrientation(value: number): { x: number; y: number } {
  switch (value) {
    case 2:
      return { x: 0, y: -90 }
    case 5:
      return { x: 0, y: 90 }
    case 6:
      return { x: 0, y: 180 }
    case 3:
      return { x: -90, y: 0 }
    case 4:
      return { x: 90, y: 0 }
    default:
      return { x: 0, y: 0 }
  }
}

/**
 * Próximo ângulo que cai na orientação `base` (módulo 360) depois de pelo menos `spins` voltas além do ângulo atual.
 * O cubo sempre gira para frente, nunca desfaz o giro.
 */
export function spinTo(current: number, base: number, spins = 2): number {
  return base + 360 * Math.ceil((current - base) / 360) + 360 * spins
}
