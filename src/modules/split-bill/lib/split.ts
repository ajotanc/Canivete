/** Tudo em centavos (inteiros), para a soma das partes fechar exatamente com a conta. */

export interface SplitInput {
  /** Valor da conta, em centavos. */
  billCents: number
  people: number
  /** Gorjeta em %, sobre a conta. */
  tipPercent: number
  /** Cada um paga um valor redondo, em reais inteiros, e a sobra vira gorjeta extra. */
  roundUp: boolean
}

export interface SplitResult {
  billCents: number
  tipCents: number
  /** Conta mais gorjeta (sem a sobra do arredondamento). */
  totalCents: number
  /** Valor da parte de quem paga menos. */
  shareCents: number
  /** Quantas pessoas pagam 1 centavo a mais (só quando não arredonda e a divisão não é exata). */
  higherCount: number
  /** Total que o grupo vai pagar de fato (com arredondamento, pode passar do total). */
  collectedCents: number
  /** Quanto passou do total por causa do arredondamento. */
  surplusCents: number
}

export function splitBill({ billCents, people, tipPercent, roundUp }: SplitInput): SplitResult {
  const count = Math.max(1, Math.floor(people))
  const tipCents = Math.round((billCents * Math.max(0, tipPercent)) / 100)
  const totalCents = billCents + tipCents

  if (roundUp) {
    const shareCents = Math.ceil(totalCents / count / 100) * 100
    const collectedCents = shareCents * count
    return { billCents, tipCents, totalCents, shareCents, higherCount: 0, collectedCents, surplusCents: collectedCents - totalCents }
  }

  const shareCents = Math.floor(totalCents / count)
  const higherCount = totalCents - shareCents * count
  return { billCents, tipCents, totalCents, shareCents, higherCount, collectedCents: totalCents, surplusCents: 0 }
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const formatCents = (cents: number): string => brl.format(cents / 100)

/** Texto pronto para mandar no grupo. */
export function splitMessage(result: SplitResult, people: number, tipPercent: number): string {
  const lines = [`Conta: ${formatCents(result.billCents)}${tipPercent > 0 ? ` + ${tipPercent}% de gorjeta (${formatCents(result.tipCents)}) = ${formatCents(result.totalCents)}` : ''}`]
  if (result.higherCount > 0) {
    lines.push(`Para ${people} pessoas: ${people - result.higherCount} pagam ${formatCents(result.shareCents)} e ${result.higherCount} pagam ${formatCents(result.shareCents + 1)}.`)
  } else {
    lines.push(`Para ${people} pessoas: ${formatCents(result.shareCents)} cada.`)
  }
  if (result.surplusCents > 0) lines.push(`Sobram ${formatCents(result.surplusCents)} por causa do arredondamento.`)
  return lines.join('\n')
}
