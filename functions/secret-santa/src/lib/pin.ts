import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keyLength: number,
) => Promise<Buffer>

const KEY_LENGTH = 32

/** Gera o hash do PIN com scrypt e um sal novo: "scrypt$<sal>$<chave>". */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(pin, salt, KEY_LENGTH)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

/** Confere o PIN contra o hash guardado, em tempo constante. */
export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [kind, saltBase64, keyBase64] = stored.split('$')
  if (kind !== 'scrypt' || !saltBase64 || !keyBase64) return false
  const expected = Buffer.from(keyBase64, 'base64')
  const actual = await scrypt(pin, Buffer.from(saltBase64, 'base64'), expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
