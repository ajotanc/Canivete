import { describe, expect, it } from 'vitest'
import {
  formatCnpj,
  formatCpf,
  checkDocument,
  formatDocument,
  generateAlphanumericCnpj,
  generateCnpj,
  generateCpf,
  generateDocument,
  isValidCnpj,
  isValidCpf,
} from '@/modules/cpf-cnpj/lib/document'
import type { RandomInt } from '@/modules/cpf-cnpj/lib/random'

/** Gerador pseudoaleatório determinístico (mulberry32), para os testes poderem rodar muitos casos. */
function seeded(seed: number): RandomInt {
  let state = seed
  return (max) => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * max)
  }
}

describe('validação (exemplos conhecidos)', () => {
  it('aceita CPFs válidos, com e sem pontuação', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('52998224725')).toBe(true)
  })

  it('recusa CPF com dígito errado, tamanho errado ou sequência repetida', () => {
    expect(isValidCpf('529.982.247-24')).toBe(false)
    expect(isValidCpf('529.982.247')).toBe(false)
    expect(isValidCpf('111.111.111-11')).toBe(false)
    expect(isValidCpf('abc.def.ghi-jk')).toBe(false)
  })

  it('aceita CNPJ numérico válido', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCnpj('11222333000181')).toBe(true)
  })

  it('aceita o exemplo oficial de CNPJ alfanumérico da Receita', () => {
    expect(isValidCnpj('12.ABC.345/01DE-35')).toBe(true)
    expect(isValidCnpj('12abc34501de35')).toBe(true)
  })

  it('recusa CNPJ com dígito errado, letra nos dígitos verificadores ou sequência repetida', () => {
    expect(isValidCnpj('12.ABC.345/01DE-34')).toBe(false)
    expect(isValidCnpj('12.ABC.345/01DE-3A')).toBe(false)
    expect(isValidCnpj('00.000.000/0000-00')).toBe(false)
    expect(isValidCnpj('12.ABC.345/01DE')).toBe(false)
  })
})

describe('geração', () => {
  const seeds = Array.from({ length: 300 }, (_, i) => i + 1)

  it('gera CPFs válidos de 11 dígitos', () => {
    for (const seed of seeds) {
      const cpf = generateCpf(seeded(seed))
      expect(cpf).toMatch(/^\d{11}$/)
      expect(isValidCpf(cpf)).toBe(true)
    }
  })

  it('gera CNPJs numéricos válidos, na matriz (0001)', () => {
    for (const seed of seeds) {
      const cnpj = generateCnpj(seeded(seed))
      expect(cnpj).toMatch(/^\d{14}$/)
      expect(cnpj.slice(8, 12)).toBe('0001')
      expect(isValidCnpj(cnpj)).toBe(true)
    }
  })

  it('gera CNPJs alfanuméricos válidos, sempre com ao menos uma letra e dígitos verificadores numéricos', () => {
    for (const seed of seeds) {
      const cnpj = generateAlphanumericCnpj(seeded(seed))
      expect(cnpj).toMatch(/^[0-9A-Z]{12}\d{2}$/)
      expect(cnpj.slice(0, 12)).toMatch(/[A-Z]/)
      expect(isValidCnpj(cnpj)).toBe(true)
    }
  })

  it('força uma letra quando o sorteio só tirou números', () => {
    // Fonte que sempre devolve o índice 0 do alfabeto ("0") nas oito posições.
    const onlyZeros: RandomInt = () => 0
    const cnpj = generateAlphanumericCnpj(onlyZeros)
    expect(cnpj.slice(0, 12)).toMatch(/[A-Z]/)
    expect(isValidCnpj(cnpj)).toBe(true)
  })

  it('não entrega sequências repetidas e sorteia de novo', () => {
    // Os nove primeiros números sorteados dão "000000000"; depois a fonte varia.
    let calls = 0
    const random: RandomInt = (max) => (calls++ < 9 ? 0 : calls % max)
    const cpf = generateCpf(random)
    expect(new Set(cpf.slice(0, 9)).size).toBeGreaterThan(1)
    expect(isValidCpf(cpf)).toBe(true)
  })

  it('usa o gerador seguro por padrão e o tipo escolhido', () => {
    expect(isValidCpf(generateDocument('cpf'))).toBe(true)
    expect(isValidCnpj(generateDocument('cnpj'))).toBe(true)
    expect(generateDocument('cnpj-alfa')).toMatch(/[A-Z]/)
  })

  it('varia: 300 CPFs seguidos quase nunca se repetem', () => {
    const all = new Set(seeds.map((seed) => generateCpf(seeded(seed))))
    expect(all.size).toBeGreaterThan(290)
  })
})

describe('formatação', () => {
  it('põe a pontuação de CPF e de CNPJ', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatCnpj('12ABC34501DE35')).toBe('12.ABC.345/01DE-35')
  })

  it('escolhe a máscara pelo tipo', () => {
    expect(formatDocument('cpf', '52998224725')).toBe('529.982.247-25')
    expect(formatDocument('cnpj', '11222333000181')).toBe('11.222.333/0001-81')
    expect(formatDocument('cnpj-alfa', '12ABC34501DE35')).toBe('12.ABC.345/01DE-35')
  })
})

describe('checkDocument', () => {
  it('reconhece CPF válido e inválido', () => {
    expect(checkDocument('529.982.247-25')).toMatchObject({ kind: 'cpf', valid: true })
    expect(checkDocument('52998224726')).toMatchObject({ kind: 'cpf', valid: false })
    expect(checkDocument('111.111.111-11').message).toContain('iguais')
  })

  it('reconhece CNPJ numérico e alfanumérico, em qualquer caixa', () => {
    expect(checkDocument('12.ABC.345/01DE-35')).toMatchObject({ kind: 'cnpj', valid: true })
    expect(checkDocument('12.abc.345/01de-35')).toMatchObject({ kind: 'cnpj', valid: true })
    expect(checkDocument('12.ABC.345/01DE-36')).toMatchObject({ kind: 'cnpj', valid: false })
  })

  it('orienta quando falta ou sobra caractere e ignora campo vazio', () => {
    expect(checkDocument('')).toEqual({ kind: null, valid: false, message: '' })
    expect(checkDocument('1234').message).toContain('Faltam')
    expect(checkDocument('123456789012').message).toContain('Faltam 2')
    expect(checkDocument('123456789012345').message).toContain('demais')
    expect(checkDocument('12@34').kind).toBeNull()
  })
})
