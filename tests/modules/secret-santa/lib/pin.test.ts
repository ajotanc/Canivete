import { describe, expect, it } from 'vitest'
import { isPin, PIN_LENGTH } from '@/modules/secret-santa/lib/pin'

describe('isPin', () => {
  it('aceita só o tamanho do campo, com números', () => {
    expect(PIN_LENGTH).toBe(4)
    expect(isPin('1234')).toBe(true)
    for (const value of ['', '123', '12345', 'abcd', '12 4', '12.4']) expect(isPin(value)).toBe(false)
  })
})
