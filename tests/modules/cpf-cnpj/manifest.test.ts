import { describe, expect, it } from 'vitest'
import { tools } from '@/core/modules/registry'

describe('módulo cpf-cnpj', () => {
  const tool = tools.find((item) => item.id === 'cpf-cnpj')

  it('é descoberto automaticamente pelo registro', () => {
    expect(tool).toBeDefined()
    expect(tool?.title).toBe('Gerador de CPF e CNPJ')
    expect(tool?.usesBackend).toBe(false)
    expect(tool?.category).toBe('Desenvolvimento')
    expect(tool?.color).toBe('pine')
  })

  it('tem a rota com o prefixo do módulo', () => {
    expect(tool?.routes.map((route) => route.path)).toEqual(['/cpf-cnpj'])
  })

  it('convive com as outras ferramentas, com o amigo secreto em primeiro', () => {
    const ids = tools.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids[0]).toBe('secret-santa')
    expect(ids).toEqual(expect.arrayContaining(['raffle', 'cpf-cnpj']))
  })
})
