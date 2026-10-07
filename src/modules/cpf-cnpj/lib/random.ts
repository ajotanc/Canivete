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
