import { SantaError } from './errors.js'
import { secureRandomInt, type RandomInt } from './random.js'

/**
 * Sorteia o amigo secreto de cada participante numa roda única embaralhada:
 * cada um tira o seguinte e o último tira o primeiro. Ninguém tira a si mesmo.
 */
export function assignSecretFriends(
  ids: string[],
  randomInt: RandomInt = secureRandomInt,
): Map<string, string> {
  if (ids.length < 3) {
    throw new SantaError('NOT_ENOUGH_PARTICIPANTS', 'São necessárias pelo menos 3 pessoas para sortear.')
  }

  const order = [...ids]
  for (let i = order.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }

  const result = new Map<string, string>()
  order.forEach((giver, index) => {
    result.set(giver, order[(index + 1) % order.length])
  })
  return result
}
