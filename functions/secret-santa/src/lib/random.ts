import { randomInt } from 'node:crypto'

/** Fonte de inteiros aleatórios em [0, maxExclusive). Injetável para testes determinísticos. */
export type RandomInt = (maxExclusive: number) => number

/** Inteiro uniforme e sem viés (o `crypto.randomInt` do Node já usa rejeição). */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
    throw new RangeError('O limite precisa ser um inteiro maior ou igual a 1.')
  }
  return randomInt(maxExclusive)
}
