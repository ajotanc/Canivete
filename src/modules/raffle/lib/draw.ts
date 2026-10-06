/** Fonte de inteiros aleatórios em [0, maxExclusive). Injetável para tornar testes determinísticos. */
export type RandomInt = (maxExclusive: number) => number

/**
 * Inteiro uniforme em [0, maxExclusive) usando crypto.getRandomValues.
 * Usa rejeição para evitar o viés do operador módulo.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
    throw new RangeError('O limite precisa ser um inteiro maior ou igual a 1.')
  }
  const range = 0x100000000
  const limit = Math.floor(range / maxExclusive) * maxExclusive
  const buffer = new Uint32Array(1)
  do {
    crypto.getRandomValues(buffer)
  } while (buffer[0] >= limit)
  return buffer[0] % maxExclusive
}

export class DrawError extends Error {
  constructor(
    public readonly code: 'EMPTY' | 'INVALID_COUNT',
    message: string,
  ) {
    super(message)
    this.name = 'DrawError'
  }
}

/**
 * Sorteia `count` vencedores com embaralhamento Fisher-Yates.
 * Cada entrada da lista é um "bilhete" independente: nomes repetidos têm mais chances.
 */
export function drawWinners(
  participants: string[],
  count: number,
  randomInt: RandomInt = secureRandomInt,
): string[] {
  if (participants.length === 0) {
    throw new DrawError('EMPTY', 'Adicione pelo menos um nome.')
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new DrawError('INVALID_COUNT', 'Informe ao menos 1 vencedor.')
  }
  if (count > participants.length) {
    throw new DrawError('INVALID_COUNT', `Restam apenas ${participants.length} nomes para sortear.`)
  }

  const pool = [...participants]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}
