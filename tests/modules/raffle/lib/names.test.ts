import { describe, expect, it } from 'vitest'
import { MAX_NAMES, MAX_NAME_LENGTH, parseNames, removeNames, validateNames } from '@/modules/raffle/lib/names'

describe('parseNames', () => {
  it('separa por linha, aplica trim e remove linhas vazias', () => {
    expect(parseNames('  Ana \n\nBruno\n   \nCarla').names).toEqual(['Ana', 'Bruno', 'Carla'])
  })

  it('aceita quebras de linha do Windows', () => {
    expect(parseNames('Ana\r\nBruno\r\n').names).toEqual(['Ana', 'Bruno'])
  })

  it('sinaliza duplicados sem diferenciar maiúsculas, sem removê-los', () => {
    const parsed = parseNames('Ana\nana\nBruno')
    expect(parsed.names).toEqual(['Ana', 'ana', 'Bruno'])
    expect(parsed.duplicates).toEqual(['Ana'])
  })

  it('sinaliza nomes acima do limite de caracteres', () => {
    const long = 'x'.repeat(MAX_NAME_LENGTH + 1)
    expect(parseNames(`Ana\n${long}`).tooLong).toEqual([long])
  })

  it('sinaliza excesso de nomes', () => {
    const raw = Array.from({ length: MAX_NAMES + 1 }, (_, i) => `Nome ${i}`).join('\n')
    expect(parseNames(raw).tooMany).toBe(true)
  })

  it('entrada vazia ou só com espaços resulta em lista vazia', () => {
    expect(parseNames('').names).toEqual([])
    expect(parseNames('   \n  \r\n').names).toEqual([])
  })
})

describe('validateNames', () => {
  it('pede ao menos um nome quando a lista está vazia', () => {
    expect(validateNames(parseNames('  \n'))).toBe('Adicione pelo menos um nome.')
  })

  it('bloqueia mais de 1.000 nomes', () => {
    const raw = Array.from({ length: MAX_NAMES + 1 }, (_, i) => `N${i}`).join('\n')
    expect(validateNames(parseNames(raw))).toMatch(/1\.000/)
  })

  it('bloqueia nomes longos demais', () => {
    expect(validateNames(parseNames('x'.repeat(MAX_NAME_LENGTH + 1)))).toMatch(/100 caracteres/)
  })

  it('devolve null quando está tudo certo, mesmo com duplicados', () => {
    expect(validateNames(parseNames('Ana\nana'))).toBeNull()
  })
})

describe('removeNames', () => {
  it('remove os nomes informados', () => {
    expect(removeNames('Ana\nBruno\nCarla', ['Bruno'])).toBe('Ana\nCarla')
  })

  it('remove apenas uma ocorrência por nome', () => {
    expect(removeNames('Ana\nAna\nBruno', ['Ana'])).toBe('Ana\nBruno')
  })

  it('preserva a ordem e ignora nomes que não existem', () => {
    expect(removeNames('Ana\nBruno', ['Zoe'])).toBe('Ana\nBruno')
  })

  it('funciona com quebras de linha do Windows', () => {
    expect(removeNames('Ana\r\nBruno\r\nCarla', ['Bruno'])).toBe('Ana\nCarla')
  })
})
