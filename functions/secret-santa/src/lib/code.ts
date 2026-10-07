import { GROUP_CODE } from '../config.js'
import { secureRandomInt, type RandomInt } from './random.js'

/** Código curto do grupo (ex.: k7x2m9), usado como id na URL. */
export function newGroupCode(randomInt: RandomInt = secureRandomInt): string {
  let code = ''
  for (let i = 0; i < GROUP_CODE.length; i++) code += GROUP_CODE.alphabet[randomInt(GROUP_CODE.alphabet.length)]
  return code
}
