import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import {
  COLOR_LUMINANCE,
  GROUP_COLORS,
  LIMITS,
  RESERVED_SLUGS,
  WISH_SEPARATOR,
} from '../config.js'
import { SantaError } from './errors.js'

dayjs.extend(customParseFormat)

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
    if (luminance > COLOR_LUMINANCE.max) throw new SantaError('INVALID_INPUT', 'Essa cor é clara demais. Escolha uma mais escura.')
    if (luminance < COLOR_LUMINANCE.min) throw new SantaError('INVALID_INPUT', 'Essa cor é escura demais. Escolha uma mais clara.')
    return hex
  }
  throw new SantaError('INVALID_INPUT', 'Escolha uma das cores disponíveis.')
}

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
  if (name.length < 1 || name.length > LIMITS.groupName) {
    throw new SantaError('INVALID_INPUT', `Informe o nome do grupo (até ${LIMITS.groupName} caracteres).`)
  }
  return name
}

/** Valor sugerido em reais: vazio vira null; aceita número (ou texto numérico) entre 0 e 1.000.000. */
export function parseBudget(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const amount = typeof value === 'string' ? Number(value.replace(',', '.')) : value
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > LIMITS.budget) {
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
  if (name.length < 1 || name.length > LIMITS.personName) {
    throw new SantaError('INVALID_INPUT', `Informe seu nome (até ${LIMITS.personName} caracteres).`)
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
  const at = stored.indexOf(WISH_SEPARATOR)
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
  if (href.length > LIMITS.wishlistUrl) {
    throw new SantaError('INVALID_INPUT', `Cada link pode ter até ${LIMITS.wishlistUrl} caracteres.`)
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
    if (text.length > LIMITS.wishlistText) {
      throw new SantaError('INVALID_INPUT', `Cada item da lista pode ter até ${LIMITS.wishlistText} caracteres.`)
    }
    const key = text.toLocaleLowerCase('pt-BR')
    if (seen.has(key)) continue
    seen.add(key)
    const url = isObject ? parseWishUrl((entry as WishItem).url) : undefined
    items.push(url ? `${text}${WISH_SEPARATOR}${url}` : text)
  }
  if (items.length > LIMITS.wishlistItems) {
    throw new SantaError('INVALID_INPUT', `A lista pode ter até ${LIMITS.wishlistItems} itens.`)
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

export function parseSlug(value: unknown): string {
  const slug = toSlug(value)
  // Ids do Appwrite têm 20 caracteres hexadecimais: um endereço assim se confundiria com o id de outro grupo.
  if (slug.length < LIMITS.slugMin || slug.length > LIMITS.slugMax || RESERVED_SLUGS.has(slug)) {
    throw new SantaError(
      'INVALID_INPUT',
      `O endereço precisa ter de ${LIMITS.slugMin} a ${LIMITS.slugMax} letras, números ou hífens (ex.: familia-da-bagunca).`,
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
