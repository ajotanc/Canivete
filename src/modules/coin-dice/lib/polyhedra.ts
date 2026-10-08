/**
 * Geometria dos dados que não são cubos: tetraedro (d4), octaedro (d8), trapezoedro pentagonal (d10),
 * dodecaedro (d12) e icosaedro (d20). Tudo centrado na origem e escalado para o vértice mais longe ficar a distância 1.
 * Os eixos seguem o CSS: x para a direita, y para baixo, z na direção de quem olha.
 */

export type Vec = readonly [number, number, number]

const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k]
export const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const length = (a: Vec): number => Math.hypot(a[0], a[1], a[2])
export const normalize = (a: Vec): Vec => scale(a, 1 / length(a))
const mean = (points: readonly Vec[]): Vec => scale(points.reduce(add, [0, 0, 0] as Vec), 1 / points.length)
const distance = (a: Vec, b: Vec): number => length(sub(a, b))

export type PolyKind = 'd4' | 'd8' | 'd10' | 'd12' | 'd20'

/** Quantas faces tem cada poliedro. */
export const FACE_COUNT: Record<PolyKind, number> = { d4: 4, d8: 8, d10: 10, d12: 12, d20: 20 }

const PHI = (1 + Math.sqrt(5)) / 2

function signs(): Array<[number, number, number]> {
  const result: Array<[number, number, number]> = []
  for (const x of [1, -1]) for (const y of [1, -1]) for (const z of [1, -1]) result.push([x, y, z])
  return result
}

/** Vértices do icosaedro de aresta 2. */
function icosahedronVertices(): Vec[] {
  const result: Vec[] = []
  for (const a of [1, -1]) {
    for (const b of [1, -1]) {
      result.push([0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a])
    }
  }
  return result
}

/** Vértices do dodecaedro (aresta 2/φ). */
function dodecahedronVertices(): Vec[] {
  const result: Vec[] = signs()
  for (const a of [1, -1]) {
    for (const b of [1, -1]) {
      result.push([0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [b * PHI, 0, a / PHI])
    }
  }
  return result
}

/** Altura do pico do d10 para as quatro pontas de cada face ficarem no mesmo plano. */
const RING_HEIGHT = 0.11
const COS36 = Math.cos(Math.PI / 5)

function decahedronFaces(): Vec[][] {
  const top: Vec = [0, 0, RING_HEIGHT * ((1 + COS36) / (1 - COS36))]
  const bottom: Vec = [0, 0, -top[2]]
  const upper = (k: number): Vec => [Math.cos((2 * Math.PI * k) / 5), Math.sin((2 * Math.PI * k) / 5), RING_HEIGHT]
  const lower = (k: number): Vec => [Math.cos((2 * Math.PI * (k + 0.5)) / 5), Math.sin((2 * Math.PI * (k + 0.5)) / 5), -RING_HEIGHT]
  const faces: Vec[][] = []
  for (let k = 0; k < 5; k++) {
    faces.push([top, upper(k), lower(k), upper(k + 1)])
    faces.push([bottom, lower(k), upper(k + 1), lower(k + 1)])
  }
  // O eixo do d10 é o z; o CSS usa y para cima/baixo, então deita o pico no eixo y.
  return faces.map((face) => face.map(([x, y, z]) => [x, z, y] as Vec))
}

function faceVertices(kind: PolyKind): Vec[][] {
  switch (kind) {
    case 'd4': {
      const v: Vec[] = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]
      return v.map((_, skip) => v.filter((__, index) => index !== skip))
    }
    case 'd8':
      return signs().map(([sx, sy, sz]) => [[sx, 0, 0], [0, sy, 0], [0, 0, sz]] as Vec[])
    case 'd10':
      return decahedronFaces()
    case 'd12': {
      const vertices = dodecahedronVertices()
      // Cada face do dodecaedro fica de frente para um vértice do icosaedro dual, que gira 90° em relação ao
      // icosaedro do d20: (±1, 0, ±φ), (0, ±φ, ±1) e (±φ, ±1, 0).
      const directions: Vec[] = []
      for (const a of [1, -1]) for (const b of [1, -1]) directions.push([a, 0, b * PHI], [0, a * PHI, b], [a * PHI, b, 0])
      return directions.map((direction) => {
        const unit = normalize(direction)
        const best = Math.max(...vertices.map((vertex) => dot(normalize(vertex), unit)))
        return vertices.filter((vertex) => Math.abs(dot(normalize(vertex), unit) - best) < 1e-6)
      })
    }
    case 'd20': {
      const vertices = icosahedronVertices()
      const faces: Vec[][] = []
      for (let a = 0; a < vertices.length; a++) {
        for (let b = a + 1; b < vertices.length; b++) {
          for (let c = b + 1; c < vertices.length; c++) {
            const edges = [distance(vertices[a], vertices[b]), distance(vertices[b], vertices[c]), distance(vertices[a], vertices[c])]
            if (edges.every((edge) => Math.abs(edge - 2) < 1e-6)) faces.push([vertices[a], vertices[b], vertices[c]])
          }
        }
      }
      return faces
    }
  }
}

export interface Face {
  /** Vértices em ordem anti-horária vista de fora. */
  vertices: Vec[]
  /** Perpendicular à face, para fora, de tamanho 1. */
  normal: Vec
  centroid: Vec
}

/** Faces do poliedro, com vértices ordenados em volta, normais para fora e o poliedro inteiro com raio 1. */
export function polyhedron(kind: PolyKind): Face[] {
  const raw = faceVertices(kind)
  const radius = Math.max(...raw.flat().map(length))
  return raw.map((corners) => {
    const points = corners.map((corner) => scale(corner, 1 / radius))
    const centroid = mean(points)
    let normal = normalize(cross(sub(points[1], points[0]), sub(points[2], points[0])))
    if (dot(normal, centroid) < 0) normal = scale(normal, -1)
    // Ordena em volta do centro: u e v formam, com a normal, uma base de mão direita (u × v = normal).
    const u = normalize(sub(points[0], centroid))
    const v = cross(normal, u)
    const ordered = [...points].sort((a, b) => Math.atan2(dot(sub(a, centroid), v), dot(sub(a, centroid), u)) - Math.atan2(dot(sub(b, centroid), v), dot(sub(b, centroid), u)))
    return { vertices: ordered, normal, centroid }
  })
}

export interface Frame {
  /** Eixos da face no espaço: x e y do desenho na face, e a normal. */
  u: Vec
  v: Vec
  n: Vec
  centroid: Vec
  /** Vértices no plano da face, em unidades do poliedro (raio 1), com a origem no centro. */
  polygon: Array<readonly [number, number]>
  /** Meia largura e meia altura do menor retângulo centrado que cobre a face. */
  halfWidth: number
  halfHeight: number
  /** Distância do centro da face até a aresta mais próxima. */
  inradius: number
}

/**
 * Base da face: o y do desenho (para baixo) aponta do vértice de referência para o centro, então esse vértice fica
 * em cima e o número sai em pé. u × v = n, para a face não sair espelhada.
 */
export function frameOf(face: Face): Frame {
  const { normal: n, centroid } = face
  const apex = face.vertices.reduce((best, vertex) => (distance(vertex, centroid) > distance(best, centroid) + 1e-9 ? vertex : best), face.vertices[0])
  const v = normalize(sub(centroid, apex))
  const u = cross(v, n)
  const polygon = face.vertices.map((vertex) => [dot(sub(vertex, centroid), u), dot(sub(vertex, centroid), v)] as const)
  const edges = polygon.map((point, index) => {
    const next = polygon[(index + 1) % polygon.length]
    const edge = [next[0] - point[0], next[1] - point[1]] as const
    return Math.abs(point[0] * edge[1] - point[1] * edge[0]) / Math.hypot(edge[0], edge[1])
  })
  return {
    u,
    v,
    n,
    centroid,
    polygon,
    halfWidth: Math.max(...polygon.map(([x]) => Math.abs(x))),
    halfHeight: Math.max(...polygon.map(([, y]) => Math.abs(y))),
    inradius: Math.min(...edges),
  }
}

const fixed = (value: number): string => (Math.abs(value) < 1e-9 ? 0 : value).toFixed(5)

/** `matrix3d` que leva o desenho plano da face (centrado) para o lugar dela no poliedro, a `radius` px do centro. */
export function faceMatrix(frame: Frame, radius: number): string {
  const { u, v, n, centroid } = frame
  return `matrix3d(${[u[0], u[1], u[2], 0, v[0], v[1], v[2], 0, n[0], n[1], n[2], 0, centroid[0] * radius, centroid[1] * radius, centroid[2] * radius, 1].map(fixed).join(',')})`
}

/** `matrix3d` de giro que leva a face para a frente, virada para quem olha e com o número em pé. */
export function faceToFrontMatrix(frame: Frame): string {
  const { u, v, n } = frame
  return `matrix3d(${[u[0], v[0], n[0], 0, u[1], v[1], n[1], 0, u[2], v[2], n[2], 0, 0, 0, 0, 1].map(fixed).join(',')})`
}

/** Brilho de 0 a 1 da face, por uma luz fixa vinda de cima e da esquerda. */
export function shade(normal: Vec): number {
  const light = normalize([-0.4, -0.7, 0.6])
  return Math.max(0, Math.min(1, 0.5 + 0.5 * dot(normal, light)))
}
