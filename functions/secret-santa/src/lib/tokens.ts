import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** Token do organizador: 32 bytes aleatórios em base64url. */
export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

/** SHA-256 em hexadecimal. É o único dado do token guardado no banco. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Confere um token recebido contra o hash guardado, em tempo constante. */
export function tokenMatches(token: unknown, storedHash: string): boolean {
  if (typeof token !== 'string' || token === '') return false
  const actual = Buffer.from(hashToken(token), 'hex')
  const expected = Buffer.from(storedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
