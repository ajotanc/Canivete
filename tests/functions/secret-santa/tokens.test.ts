import { describe, expect, it } from 'vitest'
import { generateToken, hashToken, tokenMatches } from '../../../functions/secret-santa/src/lib/tokens'

describe('tokens', () => {
  it('gera tokens diferentes e longos o bastante', () => {
    const a = generateToken()
    expect(a).not.toBe(generateToken())
    expect(a.length).toBeGreaterThanOrEqual(43)
  })

  it('o hash tem 64 caracteres hexadecimais e é estável', () => {
    const hash = hashToken('abc')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).toBe(hashToken('abc'))
    // Vetor conhecido de SHA-256 para "abc".
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('confere só o token certo', () => {
    const token = generateToken()
    const stored = hashToken(token)
    expect(tokenMatches(token, stored)).toBe(true)
    expect(tokenMatches(`${token}x`, stored)).toBe(false)
  })

  it.each([undefined, null, '', 42])('recusa token inválido %j', (value) => {
    expect(tokenMatches(value, hashToken('abc'))).toBe(false)
  })

  it('recusa hash guardado inválido sem lançar erro', () => {
    expect(tokenMatches('abc', 'curto')).toBe(false)
  })
})
