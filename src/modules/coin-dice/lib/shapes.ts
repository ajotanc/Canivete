/** Geometria dos dados desenhados na tela: pontos do cubo (d6) e silhuetas dos outros poliedros. */

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

export type Point = readonly [number, number]

/** Vértices de um polígono regular de `sides` lados, centrado em (50, 50) numa caixa de 100×100. `rotation` em graus (−90 põe um vértice em cima). */
export function regularPolygon(sides: number, radius: number, rotation = -90): Point[] {
  return Array.from({ length: sides }, (_, index) => {
    const angle = ((rotation + (360 / sides) * index) * Math.PI) / 180
    return [round(50 + radius * Math.cos(angle)), round(50 + radius * Math.sin(angle))] as const
  })
}

const round = (value: number): number => Math.round(value * 100) / 100

export const toPoints = (points: readonly Point[]): string => points.map(([x, y]) => `${x},${y}`).join(' ')

export type Segment = readonly [number, number, number, number]

export interface DieShape {
  outline: Point[]
  /** Altura (na caixa de 100) do centro visual do poliedro, onde fica o número. */
  labelY: number
  /** Arestas desenhadas por dentro, para parecer um poliedro. */
  edges: Segment[]
}

const segment = (a: Point, b: Point): Segment => [a[0], a[1], b[0], b[1]]

/** Silhueta e arestas do dado de `sides` faces (4, 8, 10, 12, 20 ou 100). O d6 é um cubo e não usa isto. */
export function dieShape(sides: number): DieShape {
  const center: Point = [50, 50]
  switch (sides) {
    case 4: {
      const outline = regularPolygon(3, 48)
      return { outline, labelY: 58, edges: outline.map((vertex) => segment(center, vertex)) }
    }
    case 8: {
      const outline = regularPolygon(4, 48)
      const inner = regularPolygon(4, 22)
      return { outline, labelY: 50, edges: [...inner.map((vertex, index) => segment(vertex, inner[(index + 1) % 4])), ...outline.map((vertex, index) => segment(vertex, inner[index]))] }
    }
    case 12: {
      const outline = regularPolygon(5, 48)
      const inner = regularPolygon(5, 24, -54)
      return {
        outline,
        labelY: 52,
        edges: [
          ...inner.map((vertex, index) => segment(vertex, inner[(index + 1) % 5])),
          // Cada vértice de fora se liga aos dois vértices de dentro mais próximos.
          ...outline.flatMap((vertex, index) => [segment(vertex, inner[index]), segment(vertex, inner[(index + 4) % 5])]),
        ],
      }
    }
    case 20: {
      const outline = regularPolygon(6, 48)
      const inner = regularPolygon(3, 26)
      return {
        outline,
        labelY: 50,
        edges: [
          ...inner.map((vertex, index) => segment(vertex, inner[(index + 1) % 3])),
          ...inner.flatMap((vertex, index) => [-1, 0, 1].map((offset) => segment(vertex, outline[(index * 2 + offset + 6) % 6]))),
        ],
      }
    }
    default: {
      // d10 e d100: um papagaio (trapezoedro pentagonal visto de lado).
      const outline: Point[] = [[50, 4], [92, 38], [50, 96], [8, 38]]
      const inner: Point[] = [[50, 28], [68, 42], [50, 70], [32, 42]]
      return { outline, labelY: 50, edges: [...inner.map((vertex, index) => segment(vertex, inner[(index + 1) % 4])), ...outline.map((vertex, index) => segment(vertex, inner[index]))] }
    }
  }
}
