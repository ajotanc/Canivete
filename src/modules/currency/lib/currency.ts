export interface Currency {
  code: string
  name: string
}

export const CURRENCIES: readonly Currency[] = [
  { code: 'BRL', name: 'Real' },
  { code: 'USD', name: 'Dólar americano' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Libra esterlina' },
  { code: 'ARS', name: 'Peso argentino' },
  { code: 'JPY', name: 'Iene' },
  { code: 'CAD', name: 'Dólar canadense' },
  { code: 'AUD', name: 'Dólar australiano' },
  { code: 'CHF', name: 'Franco suíço' },
  { code: 'CNY', name: 'Yuan' },
  { code: 'BTC', name: 'Bitcoin' },
]

/** Quanto vale 1 unidade de cada moeda em reais. O real vale 1. */
export interface Quotes {
  brl: Record<string, number>
  /** Instante (ms) da cotação mais recente. */
  at: number
}

type Fetcher = typeof fetch

const BASE_URL = 'https://economia.awesomeapi.com.br/json/last'

interface AwesomeItem {
  bid?: string
  timestamp?: string
}

/** Cotações atuais de todas as moedas em reais (AwesomeAPI). Falha de rede ou resposta sem dados lança erro. */
export async function loadQuotes(fetcher: Fetcher = fetch): Promise<Quotes> {
  const others = CURRENCIES.filter((currency) => currency.code !== 'BRL')
  const response = await fetcher(`${BASE_URL}/${others.map((currency) => `${currency.code}-BRL`).join(',')}`)
  if (!response.ok) throw new Error('Não foi possível buscar as cotações. Tente de novo em instantes.')
  const data = (await response.json()) as Record<string, AwesomeItem>
  const brl: Record<string, number> = { BRL: 1 }
  let at = 0
  for (const { code } of others) {
    const item = data[`${code}BRL`]
    const value = Number(item?.bid)
    if (Number.isFinite(value) && value > 0) {
      brl[code] = value
      at = Math.max(at, Number(item?.timestamp) * 1000 || 0)
    }
  }
  if (Object.keys(brl).length < 2) throw new Error('Não foi possível buscar as cotações. Tente de novo em instantes.')
  return { brl, at: at || Date.now() }
}

/** Quanto vale 1 `from` em `to`, passando pelo real. `null` se faltar a cotação de alguma das duas. */
export function rate(quotes: Quotes, from: string, to: string): number | null {
  const a = quotes.brl[from]
  const b = quotes.brl[to]
  return a && b ? a / b : null
}

/** Valor convertido, ou `null` se faltar cotação. */
export function convert(quotes: Quotes, amount: number, from: string, to: string): number | null {
  const factor = rate(quotes, from, to)
  return factor === null ? null : amount * factor
}

/** Formata com o símbolo da moeda; o bitcoin tem 8 casas e o resto segue o padrão da moeda. */
export function formatAmount(value: number, code: string): string {
  if (code === 'BTC') return `₿ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 8 })}`
  return value.toLocaleString('pt-BR', { style: 'currency', currency: code })
}
