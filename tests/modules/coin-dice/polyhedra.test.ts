import { describe, expect, it } from 'vitest'
import { cross, dot, FACE_COUNT, faceMatrix, faceToFrontMatrix, frameOf, length, normalize, polyhedron, shade, type PolyKind, type Vec } from '@/modules/coin-dice/lib/polyhedra'

const KINDS: PolyKind[] = ['d4', 'd8', 'd10', 'd12', 'd20']
const VERTICES_PER_FACE: Record<PolyKind, number> = { d4: 3, d8: 3, d10: 4, d12: 5, d20: 3 }

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
/** Números de dentro de `matrix3d(...)`. */
const parse = (matrix: string): number[] => matrix.slice(matrix.indexOf('(') + 1, -1).split(',').map(Number)

describe.each(KINDS)('polyhedron %s', (kind) => {
  const faces = polyhedron(kind)

  it('tem o número certo de faces, cada uma com o número certo de vértices', () => {
    expect(faces).toHaveLength(FACE_COUNT[kind])
    for (const face of faces) expect(face.vertices).toHaveLength(VERTICES_PER_FACE[kind])
  })

  it('o vértice mais longe fica a distância 1 do centro', () => {
    expect(Math.max(...faces.flatMap((face) => face.vertices.map(length)))).toBeCloseTo(1, 9)
  })

  it('cada face é plana e a normal aponta para fora', () => {
    for (const face of faces) {
      expect(length(face.normal)).toBeCloseTo(1, 9)
      expect(dot(face.normal, face.centroid)).toBeGreaterThan(0)
      for (const vertex of face.vertices) expect(Math.abs(dot(sub(vertex, face.centroid), face.normal))).toBeLessThan(1e-9)
    }
  })

  it('é convexo: todos os vértices ficam atrás do plano de cada face', () => {
    const all = faces.flatMap((face) => face.vertices)
    for (const face of faces) for (const vertex of all) expect(dot(sub(vertex, face.centroid), face.normal)).toBeLessThan(1e-9)
  })

  it('as faces são todas diferentes', () => {
    const keys = new Set(faces.map((face) => face.normal.map((value) => value.toFixed(4)).join(',')))
    expect(keys.size).toBe(faces.length)
  })

  it('a base da face é de mão direita (u × v = normal) e o polígono cabe na caixa', () => {
    for (const face of faces) {
      const frame = frameOf(face)
      const product = cross(frame.u, frame.v)
      for (let axis = 0; axis < 3; axis++) expect(product[axis]).toBeCloseTo(frame.n[axis], 9)
      expect(frame.inradius).toBeGreaterThan(0)
      for (const [x, y] of frame.polygon) {
        expect(Math.abs(x)).toBeLessThanOrEqual(frame.halfWidth + 1e-9)
        expect(Math.abs(y)).toBeLessThanOrEqual(frame.halfHeight + 1e-9)
      }
    }
  })

  it('o vértice de referência fica em cima da face (y negativo, para cima no CSS)', () => {
    for (const face of faces) {
      const { polygon } = frameOf(face)
      expect(Math.min(...polygon.map(([, y]) => y))).toBeLessThan(0)
    }
  })
})

describe('arestas e simetrias', () => {
  it('as faces do d20 e do d8 são triângulos equiláteros', () => {
    for (const kind of ['d8', 'd20'] as const) {
      for (const face of polyhedron(kind)) {
        const [a, b, c] = face.vertices
        const sides = [length(sub(a, b)), length(sub(b, c)), length(sub(c, a))]
        expect(sides[0]).toBeCloseTo(sides[1], 9)
        expect(sides[1]).toBeCloseTo(sides[2], 9)
      }
    }
  })

  it('o d12 tem faces pentagonais regulares', () => {
    for (const face of polyhedron('d12')) {
      const sides = face.vertices.map((vertex, index) => length(sub(vertex, face.vertices[(index + 1) % 5])))
      for (const side of sides) expect(side).toBeCloseTo(sides[0], 9)
    }
  })

  it('o d10 tem faces em papagaio: dois pares de lados iguais', () => {
    for (const face of polyhedron('d10')) {
      const sides = face.vertices.map((vertex, index) => length(sub(vertex, face.vertices[(index + 1) % 4]))).sort((a, b) => a - b)
      expect(sides[0]).toBeCloseTo(sides[1], 6)
      expect(sides[2]).toBeCloseTo(sides[3], 6)
      expect(sides[2]).toBeGreaterThan(sides[1])
    }
  })
})

describe('matrizes', () => {
  const frame = frameOf(polyhedron('d20')[3])

  it('a matriz de frente leva a normal da face para a direção de quem olha (z)', () => {
    const numbers = parse(faceToFrontMatrix(frame))
    // matrix3d é por colunas: a imagem de n é a combinação n.x * coluna 1 + n.y * coluna 2 + n.z * coluna 3.
    const image = [0, 1, 2].map((row) => frame.n[0] * numbers[row] + frame.n[1] * numbers[4 + row] + frame.n[2] * numbers[8 + row])
    expect(image[0]).toBeCloseTo(0, 4)
    expect(image[1]).toBeCloseTo(0, 4)
    expect(image[2]).toBeCloseTo(1, 4)
  })

  it('o eixo y do desenho vira o y da tela (número em pé)', () => {
    const numbers = parse(faceToFrontMatrix(frame))
    const image = [0, 1, 2].map((row) => frame.v[0] * numbers[row] + frame.v[1] * numbers[4 + row] + frame.v[2] * numbers[8 + row])
    expect(image[0]).toBeCloseTo(0, 4)
    expect(image[1]).toBeCloseTo(1, 4)
    expect(image[2]).toBeCloseTo(0, 4)
  })

  it('a matriz da face leva o centro do desenho ao centroide, a `radius` px', () => {
    const numbers = parse(faceMatrix(frame, 50))
    expect(numbers.slice(12, 15)).toEqual(frame.centroid.map((value) => Number((value * 50).toFixed(5))))
  })

  it('o brilho fica entre 0 e 1 e a face de frente para a luz é mais clara', () => {
    const light = normalize([-0.4, -0.7, 0.6])
    expect(shade(light)).toBeGreaterThan(shade([0.4, 0.7, -0.6]))
    for (const face of polyhedron('d12')) expect(shade(face.normal)).toBeGreaterThanOrEqual(0)
  })
})
