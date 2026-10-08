import { secureRandomInt, type RandomInt } from '@/lib/random'

export type CoinSide = 'heads' | 'tails'

/**
 * Tempos da animação, de onde saem os do som (veja `play('land')` e `play('dice')` em `core/effects/sound.ts`).
 * Moeda: duração do arremesso e as frações dele em que ela toca a mesa (a primeira queda e os três quiques).
 * Dado: duração da jogada e as frações em que ele bate na mesa (a queda e o quique).
 */
export const TOSS_MS = 1500
export const COIN_TABLE_HITS = [0.78, 0.89, 0.955, 1] as const
export const TOSS_LANDS_AT = COIN_TABLE_HITS[0]
export const DICE_ROLL_MS = 900
export const DICE_TABLE_HITS = [0.62, 0.92] as const

/** Quando cada batida da moeda cai, em segundos depois do primeiro toque na mesa. */
export const coinHitTimes = (): number[] => COIN_TABLE_HITS.map((hit) => ((hit - TOSS_LANDS_AT) * TOSS_MS) / 1000)

export const COIN_LABEL: Record<CoinSide, string> = { heads: 'Cara', tails: 'Coroa' }

export const flipCoin = (random: RandomInt = secureRandomInt): CoinSide => (random(2) === 0 ? 'heads' : 'tails')

/** Dados disponíveis: de 4 a 100 faces. */
export const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const
export const MAX_DICE = 10

export interface DiceRoll {
  sides: number
  rolls: number[]
  total: number
}

/** Rola `count` dados de `sides` faces. Quantidade e faces inválidas lançam erro. */
export function rollDice(count: number, sides: number, random: RandomInt = secureRandomInt): DiceRoll {
  if (!Number.isInteger(count) || count < 1 || count > MAX_DICE) throw new Error(`Role de 1 a ${MAX_DICE} dados.`)
  if (!(DIE_SIDES as readonly number[]).includes(sides)) throw new Error('Esse dado não existe.')
  const rolls = Array.from({ length: count }, () => 1 + random(sides))
  return { sides, rolls, total: rolls.reduce((sum, value) => sum + value, 0) }
}

/** "2d6" */
export const diceNotation = (count: number, sides: number): string => `${count}d${sides}`
