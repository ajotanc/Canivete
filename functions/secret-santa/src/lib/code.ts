import { secureRandomInt, type RandomInt } from './random.js'

/** Sem letras e números que se confundem (0/o, 1/l/i) para o código ser fácil de ler e ditar. */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const CODE_LENGTH = 6
export const MAX_CODE_ATTEMPTS = 5

/** Código curto do grupo (ex.: k7x2m9), usado como id na URL. */
export function newGroupCode(randomInt: RandomInt = secureRandomInt): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)]
  return code
}
