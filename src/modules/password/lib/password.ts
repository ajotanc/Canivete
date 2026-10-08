import { AMBIGUOUS, CHARSETS, WORDS } from '../constants'
import { secureRandomInt, shuffle, type RandomInt } from '@/lib/random'

export interface PasswordOptions {
  length: number
  lower: boolean
  upper: boolean
  digits: boolean
  symbols: boolean
  /** Tira caracteres que se confundem na leitura (O/0, l/1/I). */
  avoidAmbiguous: boolean
}

/** Grupos de caracteres ligados nas opções, já sem os ambíguos se pedido. */
export function activePools(options: PasswordOptions): string[] {
  const keys = (['lower', 'upper', 'digits', 'symbols'] as const).filter((key) => options[key])
  return keys
    .map((key) => (options.avoidAmbiguous ? [...CHARSETS[key]].filter((char) => !AMBIGUOUS.includes(char)).join('') : CHARSETS[key]))
    .filter((pool) => pool.length > 0)
}

/** Senha aleatória com pelo menos um caractere de cada grupo ligado. Sem nenhum grupo devolve vazio. */
export function generatePassword(options: PasswordOptions, random: RandomInt = secureRandomInt): string {
  const pools = activePools(options)
  if (pools.length === 0) return ''
  const length = Math.max(options.length, pools.length)
  const all = pools.join('')
  const chars = pools.map((pool) => pool[random(pool.length)])
  while (chars.length < length) chars.push(all[random(all.length)])
  return shuffle(chars, random).join('')
}

/** Frase com palavras sorteadas, separadas por hífen, com um número no fim (opcional). */
export function generatePassphrase(wordCount: number, withNumber: boolean, random: RandomInt = secureRandomInt): string {
  const words = Array.from({ length: wordCount }, () => WORDS[random(WORDS.length)])
  return withNumber ? `${words.join('-')}-${random(100)}` : words.join('-')
}

/** Entropia em bits de uma senha de `length` caracteres sorteados de `poolSize` opções. */
export const entropyBits = (poolSize: number, length: number): number => (poolSize > 1 ? Math.floor(length * Math.log2(poolSize)) : 0)

/** Entropia da frase: `log2` de cada palavra (e dos 100 números, se houver). */
export const passphraseEntropyBits = (wordCount: number, withNumber: boolean): number =>
  Math.floor(wordCount * Math.log2(WORDS.length) + (withNumber ? Math.log2(100) : 0))

export type Strength = 'weak' | 'fair' | 'good' | 'strong'

export function strengthOf(bits: number): Strength {
  if (bits < 40) return 'weak'
  if (bits < 60) return 'fair'
  if (bits < 90) return 'good'
  return 'strong'
}
