/** Geometria e sorteio da roleta. Ângulos em graus, contados no sentido horário a partir do topo, onde fica o ponteiro. */

export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 24

const step = (count: number): number => 360 / count
const radians = (degrees: number): number => ((degrees - 90) * Math.PI) / 180

const fixed = (value: number): string => value.toFixed(3)

/** Caminho SVG da fatia `index` de uma roleta de `count` fatias, de raio `radius` centrada em (50, 50). */
export function slicePath(index: number, count: number, radius = 50): string {
  const from = index * step(count)
  const to = (index + 1) * step(count)
  const [x1, y1] = [50 + radius * Math.cos(radians(from)), 50 + radius * Math.sin(radians(from))]
  const [x2, y2] = [50 + radius * Math.cos(radians(to)), 50 + radius * Math.sin(radians(to))]
  const large = step(count) > 180 ? 1 : 0
  return `M 50 50 L ${fixed(x1)} ${fixed(y1)} A ${radius} ${radius} 0 ${large} 1 ${fixed(x2)} ${fixed(y2)} Z`
}

/** Ângulo do meio da fatia, a partir do topo. */
export const sliceCenter = (index: number, count: number): number => (index + 0.5) * step(count)

/** Fatia que está sob o ponteiro quando a roleta girou `rotation` graus no sentido horário. */
export function winnerAt(rotation: number, count: number): number {
  const underPointer = (((-rotation) % 360) + 360) % 360
  return Math.min(count - 1, Math.floor(underPointer / step(count)))
}

/**
 * Ângulo final de um giro que para com a fatia `winner` sob o ponteiro, depois de pelo menos `turns` voltas.
 * `where` (de 0 a 1) escolhe o ponto da fatia onde o ponteiro para; fica longe das bordas para não gerar dúvida.
 */
export function spinTarget(current: number, winner: number, count: number, turns: number, where = 0.5): number {
  const margin = 0.12
  const inside = margin + Math.min(1, Math.max(0, where)) * (1 - 2 * margin)
  const wanted = winner * step(count) + inside * step(count)
  // Girar R deixa sob o ponteiro o ângulo (-R mod 360) da roleta.
  const base = ((((-wanted) - current) % 360) + 360) % 360
  return current + 360 * Math.max(0, Math.floor(turns)) + base
}

/** Cores das fatias, nas cores de cabo das ferramentas. */
export const PALETTE = ['cobalt', 'berry', 'pine', 'amber', 'violet'] as const

/** Índice da cor da fatia: percorre a paleta, mas a última nunca repete a cor da primeira. */
export function colorIndex(index: number, count: number): number {
  if (index === count - 1 && count > 1 && index % PALETTE.length === 0) return 2
  return index % PALETTE.length
}

/** Texto da fatia, cortado para caber. */
export function fitLabel(text: string, max = 14): string {
  const clean = text.trim().replace(/\s+/g, ' ')
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

/** Tamanho da letra (na caixa de 100) conforme o número de fatias. */
export const labelSize = (count: number): number => (count > 18 ? 3 : count > 12 ? 3.6 : count > 7 ? 4.4 : 5.4)
