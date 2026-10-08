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
