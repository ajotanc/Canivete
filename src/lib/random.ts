export type RandomInt = (max: number) => number

/** Inteiro uniforme em [0, max) com `crypto.getRandomValues` e rejeição, sem viés. */
export function secureRandomInt(max: number): number {
  const range = 0x100000000
  const limit = range - (range % max)
  const buffer = new Uint32Array(1)
  do {
    crypto.getRandomValues(buffer)
  } while (buffer[0] >= limit)
  return buffer[0] % max
}

/** Embaralha uma cópia da lista (Fisher-Yates). */
export function shuffle<T>(items: readonly T[], random: RandomInt = secureRandomInt): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const other = random(index + 1)
    const swap = result[index]
    result[index] = result[other]
    result[other] = swap
  }
  return result
}
