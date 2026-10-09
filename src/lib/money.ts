const formatters = new Map<string, Intl.NumberFormat>()

/** Formatador da moeda, sempre com 2 casas (a máscara conta os dígitos em centavos, inclusive no iene). */
function formatter(currency: string): Intl.NumberFormat {
  let found = formatters.get(currency)
  if (!found) {
    found = new Intl.NumberFormat('pt-BR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
    formatters.set(currency, found)
  }
  return found
}

/**
 * Formata um valor para exibir: 50 vira "R$ 50,00" (ou "US$ 50,00" com `currency` 'USD').
 * Vazio (null/NaN) vira "".
 */
export function formatMoney(value: number | null | undefined, currency = 'BRL'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  return formatter(currency).format(value)
}

const BRL_WHOLE = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

/** Valor em reais para caber em espaço curto (caixa de fato do cabeçalho): sem centavos quando é redondo ("R$ 100"). */
export function formatMoneyShort(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  return Number.isInteger(value) ? BRL_WHOLE.format(value) : formatMoney(value)
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

/** Máscara de digitação: aplica o formato da moeda (real por padrão) ao texto atual do campo. */
export function maskMoney(text: string, currency = 'BRL'): string {
  return formatMoney(parseMoney(text), currency)
}
