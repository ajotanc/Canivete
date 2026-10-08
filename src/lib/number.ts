/**
 * Converte o texto digitado em número, no jeito brasileiro: "1.234,56", "12,5", "R$ 10", "15%".
 * Ponto sozinho vale como decimal ("12.5"), exceto em milhares ("1.234"). Vazio ou inválido devolve null.
 */
export function parseDecimal(text: string): number | null {
  const cleaned = text.replace(/[R$%\s]/g, '')
  if (!/^-?[\d.,]+$/.test(cleaned) || !/\d/.test(cleaned)) return null
  let normalized: string
  if (cleaned.includes(',')) normalized = cleaned.replace(/\./g, '').replace(',', '.')
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) normalized = cleaned.replace(/\./g, '')
  else normalized = cleaned
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

const plain = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** "1.234,5" (até 2 casas, sem zeros sobrando). */
export const formatNumber = (value: number): string => plain.format(value)
/** "R$ 1.234,50". */
export const formatBrl = (value: number): string => money.format(value)
