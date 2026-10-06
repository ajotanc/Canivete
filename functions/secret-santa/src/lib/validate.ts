import { SantaError } from './errors.js'

export const MAX_GROUP_NAME = 80
export const MAX_BUDGET = 40
export const MAX_PERSON_NAME = 60
export const MAX_WISHLIST = 500
export const MAX_PARTICIPANTS = 100

/** Texto de uma linha: NFC, espaços nas pontas removidos e espaços repetidos colapsados. */
export function cleanLine(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.normalize('NFC').trim().replace(/\s+/g, ' ')
}

/** Chave de comparação de nomes: ignora caixa e espaços, mas mantém acentos. */
export function toNameKey(name: string): string {
  return cleanLine(name).toLocaleLowerCase('pt-BR')
}

export function parseGroupName(value: unknown): string {
  const name = cleanLine(value)
  if (name.length < 1 || name.length > MAX_GROUP_NAME) {
    throw new SantaError('INVALID_INPUT', `Informe o nome do grupo (até ${MAX_GROUP_NAME} caracteres).`)
  }
  return name
}

export function parseBudget(value: unknown): string {
  const budget = cleanLine(value)
  if (budget.length > MAX_BUDGET) {
    throw new SantaError('INVALID_INPUT', `O valor sugerido pode ter até ${MAX_BUDGET} caracteres.`)
  }
  return budget
}

/** Aceita vazio ou uma data real no formato AAAA-MM-DD. */
export function parseEventDate(value: unknown): string {
  const date = cleanLine(value)
  if (date === '') return ''
  const parsed = new Date(`${date}T00:00:00Z`)
  // Datas impossíveis como 2026-13-01 viram Invalid Date; 2026-02-30 "rola" para março e não bate.
  const isReal =
    /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
  if (!isReal) {
    throw new SantaError('INVALID_INPUT', 'Informe a data no formato AAAA-MM-DD, por exemplo 2026-12-24.')
  }
  return date
}

export function parsePersonName(value: unknown): string {
  const name = cleanLine(value)
  if (name.length < 1 || name.length > MAX_PERSON_NAME) {
    throw new SantaError('INVALID_INPUT', `Informe seu nome (até ${MAX_PERSON_NAME} caracteres).`)
  }
  return name
}

/** O PIN precisa ser texto com 4 a 6 números, sem espaços. */
export function parsePin(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4,6}$/.test(value)) {
    throw new SantaError('INVALID_INPUT', 'O PIN precisa ter de 4 a 6 números.')
  }
  return value
}

/** Lista de desejos: preserva quebras de linha, remove só as pontas. */
export function parseWishlist(value: unknown): string {
  const wishlist = typeof value === 'string' ? value.normalize('NFC').trim() : ''
  if (wishlist.length > MAX_WISHLIST) {
    throw new SantaError('INVALID_INPUT', `A lista de desejos pode ter até ${MAX_WISHLIST} caracteres.`)
  }
  return wishlist
}

/** Ids fora do formato do Appwrite nunca existem: tratados como grupo não encontrado. */
export function parseGroupId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(value)) {
    throw new SantaError('GROUP_NOT_FOUND', 'Grupo não encontrado.')
  }
  return value
}
