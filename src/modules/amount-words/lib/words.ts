const UNITS = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const TENS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const HUNDREDS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

/** Escalas de 1.000 em 1.000: singular, plural. A de 1.000 não tem plural próprio ("mil"). */
const SCALES: ReadonlyArray<readonly [string, string]> = [
  ['', ''],
  ['mil', 'mil'],
  ['milhão', 'milhões'],
  ['bilhão', 'bilhões'],
]

/** Maior número aceito: 999 bilhões, 999 milhões, 999 mil e 999. */
export const MAX_NUMBER = 999_999_999_999

/** 0 a 999, sem escala. */
function underThousand(n: number): string {
  if (n < 20) return UNITS[n]
  if (n < 100) {
    const unit = n % 10
    return unit === 0 ? TENS[n / 10] : `${TENS[Math.floor(n / 10)]} e ${UNITS[unit]}`
  }
  if (n === 100) return 'cem'
  const rest = n % 100
  return rest === 0 ? HUNDREDS[n / 100] : `${HUNDREDS[Math.floor(n / 100)]} e ${underThousand(rest)}`
}

/**
 * Número inteiro por extenso em português do Brasil: 1234 vira "mil duzentos e trinta e quatro".
 * Usa "e" antes do último grupo quando ele é menor que 100 ou redondo (mil e quinhentos, dois milhões e duzentos mil).
 * Aceita de 0 até `MAX_NUMBER`; fora disso lança erro.
 */
export function numberToWords(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > MAX_NUMBER) throw new Error(`Use um número inteiro entre 0 e ${MAX_NUMBER.toLocaleString('pt-BR')}.`)
  if (value === 0) return 'zero'

  const groups: Array<{ amount: number; scale: number }> = []
  for (let scale = 0, rest = value; rest > 0; scale++, rest = Math.floor(rest / 1000)) {
    const amount = rest % 1000
    if (amount > 0) groups.unshift({ amount, scale })
  }

  const parts = groups.map(({ amount, scale }) => {
    if (scale === 0) return underThousand(amount)
    const [singular, plural] = SCALES[scale]
    if (scale === 1) return amount === 1 ? 'mil' : `${underThousand(amount)} mil`
    return `${underThousand(amount)} ${amount === 1 ? singular : plural}`
  })

  if (parts.length === 1) return parts[0]
  const last = groups[groups.length - 1].amount
  const joinWithAnd = last < 100 || last % 100 === 0
  return `${parts.slice(0, -1).join(' ')}${joinWithAnd ? ' e ' : ' '}${parts[parts.length - 1]}`
}

/** "de" aparece antes de "reais" quando o valor termina em milhão ou bilhão redondo: "um milhão de reais". */
const needsDe = (reais: number): boolean => reais >= 1_000_000 && reais % 1_000_000 === 0

/** Valor em centavos por extenso: 123456 vira "mil duzentos e trinta e quatro reais e cinquenta e seis centavos". */
export function moneyToWords(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0 || cents > MAX_NUMBER * 100 + 99) throw new Error('Valor fora do limite.')
  const reais = Math.floor(cents / 100)
  const centavos = cents % 100

  const reaisText = `${numberToWords(reais)}${needsDe(reais) ? ' de' : ''} ${reais === 1 ? 'real' : 'reais'}`
  const centavosText = `${numberToWords(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`

  if (centavos === 0) return reaisText
  if (reais === 0) return centavosText
  return `${reaisText} e ${centavosText}`
}

export const capitalizeFirst = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)
