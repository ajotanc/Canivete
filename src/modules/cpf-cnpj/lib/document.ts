import {
  CNPJ_ALPHABET,
  CNPJ_BRANCH,
  CNPJ_ROOT_LENGTH,
  CNPJ_WEIGHTS_1,
  CNPJ_WEIGHTS_2,
  CPF_BASE_LENGTH,
  CPF_WEIGHTS_1,
  CPF_WEIGHTS_2,
  DIGITS,
  LETTERS,
  type DocumentType,
} from '../constants'
import { secureRandomInt, type RandomInt } from './random'

/** Valor de cada caractere no cálculo: o código ASCII menos 48. Vale "0" a "9" para 0 a 9 e "A" a "Z" para 17 a 42. */
const charValue = (char: string): number => char.charCodeAt(0) - 48

/** Dígito verificador pelo módulo 11: resto menor que 2 vira 0, senão 11 menos o resto. */
function checkDigit(values: readonly number[], weights: readonly number[]): number {
  const sum = values.reduce((total, value, index) => total + value * weights[index], 0)
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

/** Sequências como 111.111.111-11 passam na conta, mas a Receita as recusa. */
const isRepeated = (chars: string): boolean => new Set(chars).size === 1

function randomChars(length: number, alphabet: string, random: RandomInt): string {
  let result = ''
  for (let i = 0; i < length; i++) result += alphabet[random(alphabet.length)]
  return result
}

/** Acrescenta os dois dígitos verificadores aos 9 primeiros dígitos do CPF. */
function withCpfCheckDigits(base: string): string {
  const first = checkDigit([...base].map(charValue), CPF_WEIGHTS_1)
  const second = checkDigit([...base, String(first)].map(charValue), CPF_WEIGHTS_2)
  return `${base}${first}${second}`
}

/** Acrescenta os dois dígitos verificadores às 12 primeiras posições do CNPJ (numérico ou alfanumérico). */
function withCnpjCheckDigits(base: string): string {
  const values = [...base].map(charValue)
  const first = checkDigit(values, CNPJ_WEIGHTS_1)
  const second = checkDigit([...values, first], CNPJ_WEIGHTS_2)
  return `${base}${first}${second}`
}

/** CPF com 11 dígitos, sem pontuação. */
export function generateCpf(random: RandomInt = secureRandomInt): string {
  let base: string
  do {
    base = randomChars(CPF_BASE_LENGTH, DIGITS, random)
  } while (isRepeated(base))
  return withCpfCheckDigits(base)
}

/** CNPJ numérico com 14 dígitos (matriz, ordem 0001), sem pontuação. */
export function generateCnpj(random: RandomInt = secureRandomInt): string {
  let root: string
  do {
    root = randomChars(CNPJ_ROOT_LENGTH, DIGITS, random)
  } while (isRepeated(root))
  return withCnpjCheckDigits(root + CNPJ_BRANCH)
}

/** CNPJ alfanumérico: letras e números nas 12 primeiras posições, dígitos verificadores numéricos. Sempre tem ao menos uma letra. */
export function generateAlphanumericCnpj(random: RandomInt = secureRandomInt): string {
  let root = randomChars(CNPJ_ROOT_LENGTH, CNPJ_ALPHABET, random)
  if (!/[A-Z]/.test(root)) {
    const at = random(CNPJ_ROOT_LENGTH)
    root = root.slice(0, at) + LETTERS[random(LETTERS.length)] + root.slice(at + 1)
  }
  return withCnpjCheckDigits(root + CNPJ_BRANCH)
}

export function generateDocument(type: DocumentType, random: RandomInt = secureRandomInt): string {
  if (type === 'cpf') return generateCpf(random)
  if (type === 'cnpj') return generateCnpj(random)
  return generateAlphanumericCnpj(random)
}

export const formatCpf = (value: string): string => `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`

export const formatCnpj = (value: string): string =>
  `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`

export const formatDocument = (type: DocumentType, value: string): string => (type === 'cpf' ? formatCpf(value) : formatCnpj(value))

/** Confere um CPF, com ou sem pontuação. */
export function isValidCpf(value: string): boolean {
  const digits = value.replace(/[.\-\s]/g, '')
  if (!/^\d{11}$/.test(digits) || isRepeated(digits)) return false
  return withCpfCheckDigits(digits.slice(0, CPF_BASE_LENGTH)) === digits
}

/** Confere um CNPJ numérico ou alfanumérico, com ou sem pontuação e em qualquer caixa. */
export function isValidCnpj(value: string): boolean {
  const chars = value.replace(/[./\-\s]/g, '').toUpperCase()
  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars) || isRepeated(chars)) return false
  return withCnpjCheckDigits(chars.slice(0, 12)) === chars
}
