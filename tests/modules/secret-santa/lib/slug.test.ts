import { describe, expect, it } from 'vitest'
import { isUsableSlug, slugifyInput, trimSlug } from '@/modules/secret-santa/lib/slug'

describe('slugifyInput', () => {
  it('troca espaços por hífen e tira acentos', () => {
    expect(slugifyInput('Família da Bagunça')).toBe('familia-da-bagunca')
  })

  it('mantém o hífen do fim enquanto digita e junta símbolos repetidos', () => {
    expect(slugifyInput('turma ')).toBe('turma-')
    expect(slugifyInput('a  &  b')).toBe('a-b')
  })

  it('não começa com hífen', () => {
    expect(slugifyInput(' -Natal!')).toBe('natal-')
  })
})

describe('trimSlug', () => {
  it('tira o hífen do fim ao sair do campo', () => {
    expect(trimSlug('turma-')).toBe('turma')
    expect(trimSlug('-a-b--')).toBe('a-b')
  })
})

describe('isUsableSlug', () => {
  it('descarta texto curto ou reservado', () => {
    expect(isUsableSlug('familia')).toBe(true)
    expect(isUsableSlug('oi')).toBe(false)
    expect(isUsableSlug('admin')).toBe(false)
  })
})
