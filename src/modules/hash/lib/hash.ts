import { secureRandomInt, type RandomInt } from '@/lib/random'

export type UuidVersion = 'v4' | 'v7'

const hex = (bytes: Uint8Array): string => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

/** Formata 16 bytes como UUID: 8-4-4-4-12. */
function formatUuid(bytes: Uint8Array): string {
  const h = hex(bytes)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

function randomBytes(length: number, random: RandomInt): Uint8Array {
  return Uint8Array.from({ length }, () => random(256))
}

/** UUID versão 4: 122 bits aleatórios. */
export function uuidV4(random: RandomInt = secureRandomInt): string {
  const bytes = randomBytes(16, random)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return formatUuid(bytes)
}

/** UUID versão 7: 48 bits de milissegundos Unix no começo (ordenável por data) e o resto aleatório. */
export function uuidV7(now: number = Date.now(), random: RandomInt = secureRandomInt): string {
  const bytes = randomBytes(16, random)
  const time = BigInt(Math.max(0, Math.floor(now)))
  for (let index = 0; index < 6; index++) bytes[index] = Number((time >> BigInt(8 * (5 - index))) & 0xffn)
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return formatUuid(bytes)
}

export interface UuidOptions {
  version: UuidVersion
  uppercase: boolean
  dashes: boolean
}

export function generateUuid({ version, uppercase, dashes }: UuidOptions, random: RandomInt = secureRandomInt, now: number = Date.now()): string {
  let value = version === 'v7' ? uuidV7(now, random) : uuidV4(random)
  if (!dashes) value = value.replace(/-/g, '')
  return uppercase ? value.toUpperCase() : value
}

export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]

const encode = (text: string): Uint8Array<ArrayBuffer> => new TextEncoder().encode(text) as Uint8Array<ArrayBuffer>

/** Hash do texto (UTF-8) em hexadecimal. */
export async function digestHex(algorithm: HashAlgorithm, text: string, subtle: SubtleCrypto = crypto.subtle): Promise<string> {
  return hex(new Uint8Array(await subtle.digest(algorithm, encode(text))))
}

/** HMAC do texto com a chave (UTF-8), em hexadecimal. */
export async function hmacHex(algorithm: HashAlgorithm, key: string, text: string, subtle: SubtleCrypto = crypto.subtle): Promise<string> {
  const cryptoKey = await subtle.importKey('raw', encode(key), { name: 'HMAC', hash: algorithm }, false, ['sign'])
  return hex(new Uint8Array(await subtle.sign('HMAC', cryptoKey, encode(text))))
}
