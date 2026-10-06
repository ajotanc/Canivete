const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Formata um valor em reais para exibir: 50 vira "R$ 50,00". Vazio (null/NaN) vira "". */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  return BRL.format(value)
}

/**
 * Converte o texto digitado ("R$ 1.234,56", "1234,56" ou só dígitos) para o valor do banco (1234.56).
 * Os dígitos entram da direita para a esquerda, como em maquininha: "5000" é 50,00.
 * Sem dígitos devolve null.
 */
export function parseMoney(text: string | null | undefined): number | null {
  const digits = (text ?? '').replace(/\D/g, '')
  if (digits === '') return null
  return Number(digits) / 100
}

/** Máscara de digitação: aplica o formato de moeda ao texto atual do campo. */
export function maskMoney(text: string): string {
  return formatMoney(parseMoney(text))
}
