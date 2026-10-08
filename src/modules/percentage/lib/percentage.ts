import { formatNumber } from '@/lib/number'

export { formatBrl, formatNumber, parseDecimal } from '@/lib/number'

/** "12,5%". */
export const formatPercent = (value: number): string => `${formatNumber(value)}%`

/** Quanto é `percent`% de `value`. */
export const percentOf = (percent: number, value: number): number => (value * percent) / 100

/** Quantos % `part` é de `total`; null se o total é zero. */
export const whatPercent = (part: number, total: number): number | null => (total === 0 ? null : (part / total) * 100)

/** Variação percentual de `from` para `to`; null se partiu de zero. Aumento é positivo. */
export const percentChange = (from: number, to: number): number | null => (from === 0 ? null : ((to - from) / Math.abs(from)) * 100)

/** Preço com desconto (negativo vira acréscimo). */
export function applyDiscount(price: number, percent: number): { final: number; difference: number } {
  const difference = percentOf(percent, price)
  return { final: price - difference, difference }
}

/** Preço com acréscimo (ex.: imposto, margem). */
export function applyIncrease(price: number, percent: number): { final: number; difference: number } {
  const difference = percentOf(percent, price)
  return { final: price + difference, difference }
}

/** Juros simples: taxa em % por período. */
export function simpleInterest(principal: number, ratePercent: number, periods: number): { interest: number; total: number } {
  const interest = principal * (ratePercent / 100) * periods
  return { interest, total: principal + interest }
}

/** Juros compostos: taxa em % por período. */
export function compoundInterest(principal: number, ratePercent: number, periods: number): { interest: number; total: number } {
  const total = principal * (1 + ratePercent / 100) ** periods
  return { interest: total - principal, total }
}
