import { DRAW } from '../config.js'
import { SantaError } from './errors.js'
import { secureRandomInt, type RandomInt } from './random.js'

/**
 * Sorteia o amigo secreto de cada participante numa roda única embaralhada:
 * cada um tira o seguinte e o último tira o primeiro. Ninguém tira a si mesmo,
 * nem quem está nos pares proibidos (nos dois sentidos).
 */
export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

export function assignSecretFriends(
  ids: string[],
  randomInt: RandomInt = secureRandomInt,
  forbidden: ReadonlySet<string> = new Set(),
): Map<string, string> {
  if (ids.length < DRAW.minParticipants) {
    throw new SantaError('NOT_ENOUGH_PARTICIPANTS', `São necessárias pelo menos ${DRAW.minParticipants} pessoas para sortear.`)
  }

  const order = [...ids]
  const allowed = () => order.every((giver, index) => !forbidden.has(pairKey(giver, order[(index + 1) % order.length])))
  let attempt = 0
  do {
    for (let i = order.length - 1; i > 0; i--) {
      const j = randomInt(i + 1)
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    attempt++
  } while (forbidden.size > 0 && !allowed() && attempt < DRAW.maxAttempts)
  if (!allowed()) {
    throw new SantaError('DRAW_IMPOSSIBLE', 'Não dá para sortear com essas regras. Tire alguma restrição e tente de novo.')
  }

  const result = new Map<string, string>()
  order.forEach((giver, index) => {
    result.set(giver, order[(index + 1) % order.length])
  })
  return result
}
