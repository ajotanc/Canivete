import { describe, expect, it } from 'vitest'
import { WORDS } from '@/modules/password/constants'
import { activePools, entropyBits, generatePassphrase, generatePassword, strengthOf, type PasswordOptions } from '@/modules/password/lib/password'

const base: PasswordOptions = { length: 16, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false }

describe('generatePassword', () => {
  it('respeita o tamanho e usa um caractere de cada grupo ligado', () => {
    for (let i = 0; i < 50; i++) {
      const password = generatePassword({ ...base, length: 8 })
      expect(password).toHaveLength(8)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[0-9]/)
      expect(password).toMatch(/[!@#$%&*?+=_-]/)
    }
  })

  it('só usa os grupos ligados', () => {
    expect(generatePassword({ ...base, upper: false, symbols: false, length: 30 })).toMatch(/^[a-z0-9]{30}$/)
  })

  it('sem grupo nenhum devolve vazio', () => {
    expect(generatePassword({ ...base, lower: false, upper: false, digits: false, symbols: false })).toBe('')
  })

  it('evita caracteres ambíguos quando pedido', () => {
    for (let i = 0; i < 50; i++) expect(generatePassword({ ...base, avoidAmbiguous: true, length: 64 })).not.toMatch(/[O0oIl1|]/)
  })

  it('o tamanho nunca fica abaixo do número de grupos', () => {
    expect(generatePassword({ ...base, length: 2 })).toHaveLength(4)
  })
})

describe('activePools', () => {
  it('lista os grupos ligados', () => {
    expect(activePools({ ...base, lower: false, upper: false, symbols: false })).toEqual(['0123456789'])
  })
})

describe('generatePassphrase', () => {
  it('junta as palavras com hífen e põe número no fim se pedido', () => {
    expect(generatePassphrase(4, false)).toMatch(/^[^-]+(-[^-]+){3}$/)
    expect(generatePassphrase(3, true)).toMatch(/^[^-]+(-[^-]+){2}-\d{1,2}$/)
  })

  it('a lista tem 128 palavras diferentes', () => {
    expect(WORDS).toHaveLength(128)
    expect(new Set(WORDS).size).toBe(128)
  })
})

describe('força', () => {
  it('calcula a entropia e classifica', () => {
    expect(entropyBits(62, 16)).toBe(95)
    expect(entropyBits(1, 16)).toBe(0)
    expect(strengthOf(30)).toBe('weak')
    expect(strengthOf(50)).toBe('fair')
    expect(strengthOf(70)).toBe('good')
    expect(strengthOf(95)).toBe('strong')
  })
})
