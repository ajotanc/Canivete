import { describe, expect, it } from 'vitest'
import { hashPin, verifyPin } from '../../../functions/secret-santa/src/lib/pin'

describe('hashPin / verifyPin', () => {
  it('confirma o PIN certo e recusa o errado', async () => {
    const stored = await hashPin('1234')
    expect(await verifyPin('1234', stored)).toBe(true)
    expect(await verifyPin('1235', stored)).toBe(false)
  })

  it('usa um sal diferente a cada hash', async () => {
    expect(await hashPin('1234')).not.toBe(await hashPin('1234'))
  })

  it('não contém o PIN e cabe na coluna de 200 caracteres', async () => {
    const stored = await hashPin('987654')
    expect(stored).not.toContain('987654')
    expect(stored.length).toBeLessThan(200)
  })

  it('recusa valores guardados em formato inválido', async () => {
    expect(await verifyPin('1234', 'lixo')).toBe(false)
    expect(await verifyPin('1234', '')).toBe(false)
  })
})
