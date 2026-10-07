import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import { SantaError } from './errors.js'

dayjs.extend(customParseFormat)

export const MAX_GROUP_NAME = 80
export const MAX_PERSON_NAME = 60
export const MAX_WISHLIST_ITEMS = 10
export const MAX_WISHLIST_ITEM = 100
export const MAX_WISHLIST_URL = 500
/** Cores que o organizador pode dar ao grupo; sem escolha vale `berry` (framboesa). */
export const GROUP_COLORS = ['berry', 'cobalt', 'pine', 'violet', 'amber'] as const
export type GroupColor = (typeof GROUP_COLORS)[number]
export const DEFAULT_GROUP_COLOR: GroupColor = 'berry'

/** Luminância relativa (WCAG) de #RRGGBB. */
export function hexLuminance(hex: string): number {
  const channel = (start: number) => {
    const v = parseInt(hex.slice(start, start + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** Cor da lista ou uma cor livre #RRGGBB que dê contraste com texto branco (nem clara demais, nem escura demais). */
export function parseGroupColor(value: unknown): string {
  if (typeof value === 'string' && (GROUP_COLORS as readonly string[]).includes(value)) return value
  if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) {
    const hex = value.toLowerCase()
    const luminance = hexLuminance(hex)
    if (luminance > 0.3) throw new SantaError('INVALID_INPUT', 'Essa cor é clara demais. Escolha uma mais escura.')
    if (luminance < 0.02) throw new SantaError('INVALID_INPUT', 'Essa cor é escura demais. Escolha uma mais clara.')
    return hex
  }
  throw new SantaError('INVALID_INPUT', 'Escolha uma das cores disponíveis.')
}
/** Separa o texto do link dentro de um item guardado (um valor só por item na coluna). */
const WISH_SEP = String.fromCharCode(9)
export const MAX_QUESTION = 200
export const MAX_ANSWER = 300
export const MAX_POST = 300
export const MAX_QUESTIONS_PER_PERSON = 10
export const MAX_BUDGET = 1_000_000
export const MIN_SLUG = 3
export const MAX_SLUG = 40
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

/** Valor sugerido em reais: vazio vira null; aceita número (ou texto numérico) entre 0 e 1.000.000. */
export function parseBudget(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const amount = typeof value === 'string' ? Number(value.replace(',', '.')) : value
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > MAX_BUDGET) {
    throw new SantaError('INVALID_INPUT', 'Informe um valor sugerido válido, em reais.')
  }
  return Math.round(amount * 100) / 100
}

/** Aceita vazio ou uma data real no formato AAAA-MM-DD. */
export function parseEventDate(value: unknown): string {
  const date = cleanLine(value)
  if (date === '') return ''
  // Modo estrito: datas impossíveis como 2026-13-01 ou 2026-02-30 são inválidas.
  const isReal = /^\d{4}-\d{2}-\d{2}$/.test(date) && dayjs(date, 'YYYY-MM-DD', true).isValid()
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

export interface WishItem {
  text: string
  url?: string
}

/** Item guardado como texto simples ou "texto<TAB>link". */
export function decodeWish(stored: string): WishItem {
  const at = stored.indexOf(WISH_SEP)
  if (at === -1) return { text: stored }
  return { text: stored.slice(0, at), url: stored.slice(at + 1) }
}

/** Só aceita http e https; devolve o endereço normalizado. */
function parseWishUrl(value: unknown): string | undefined {
  const raw = cleanLine(value)
  if (raw === '') return undefined
  let url: URL
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`)
  } catch {
    throw new SantaError('INVALID_INPUT', 'Um dos links não é válido. Cole o endereço completo do produto.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SantaError('INVALID_INPUT', 'O link precisa começar com http:// ou https://.')
  }
  const href = url.href
  if (href.length > MAX_WISHLIST_URL) {
    throw new SantaError('INVALID_INPUT', `Cada link pode ter até ${MAX_WISHLIST_URL} caracteres.`)
  }
  return href
}

/**
 * Lista de desejos: aceita textos, itens `{ text, url? }` ou um texto com um item por linha (formato antigo).
 * Remove itens vazios e repetidos; devolve os itens prontos para guardar, ou null se não sobrar nenhum.
 */
export function parseWishlist(value: unknown): string[] | null {
  const raw: unknown[] = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\r?\n/) : []
  const items: string[] = []
  const seen = new Set<string>()
  for (const entry of raw) {
    const isObject = typeof entry === 'object' && entry !== null
    const text = cleanLine(isObject ? (entry as WishItem).text : entry)
    if (text === '') continue
    if (text.length > MAX_WISHLIST_ITEM) {
      throw new SantaError('INVALID_INPUT', `Cada item da lista pode ter até ${MAX_WISHLIST_ITEM} caracteres.`)
    }
    const key = text.toLocaleLowerCase('pt-BR')
    if (seen.has(key)) continue
    seen.add(key)
    const url = isObject ? parseWishUrl((entry as WishItem).url) : undefined
    items.push(url ? `${text}${WISH_SEP}${url}` : text)
  }
  if (items.length > MAX_WISHLIST_ITEMS) {
    throw new SantaError('INVALID_INPUT', `A lista pode ter até ${MAX_WISHLIST_ITEMS} itens.`)
  }
  return items.length > 0 ? items : null
}

/** Texto livre curto e obrigatório (pergunta, resposta, recado). */
export function parseMessage(value: unknown, max: number, label: string): string {
  const text = typeof value === 'string' ? value.normalize('NFC').trim() : ''
  if (text.length < 1 || text.length > max) {
    throw new SantaError('INVALID_INPUT', `${label} precisa ter de 1 a ${max} caracteres.`)
  }
  return text
}

/** Texto do link: minúsculas, números e hífens; acentos e espaços são convertidos. */
export function toSlug(value: unknown): string {
  return cleanLine(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Nomes que são rotas do grupo (`/g/:id/me`, `/g/:id/admin`) e não podem ser texto de link. */
const RESERVED_SLUGS = new Set(['me', 'admin'])

export function parseSlug(value: unknown): string {
  const slug = toSlug(value)
  // Ids do Appwrite têm 20 caracteres hexadecimais: um endereço assim se confundiria com o id de outro grupo.
  if (slug.length < MIN_SLUG || slug.length > MAX_SLUG || RESERVED_SLUGS.has(slug)) {
    throw new SantaError(
      'INVALID_INPUT',
      `O endereço precisa ter de ${MIN_SLUG} a ${MAX_SLUG} letras, números ou hífens (ex.: familia-da-bagunca).`,
    )
  }
  return slug
}

/** Ids fora do formato do Appwrite nunca existem: tratados como grupo não encontrado. */
export function parseGroupId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/.test(value)) {
    throw new SantaError('GROUP_NOT_FOUND', 'Grupo não encontrado.')
  }
  return value
}
