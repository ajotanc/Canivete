import { describe, expect, it } from 'vitest'
import { isValidCnpj, isValidCpf } from '@/modules/cpf-cnpj/lib/document'
import { useDocumentGenerator } from '@/modules/cpf-cnpj/composables/useDocumentGenerator'

describe('useDocumentGenerator', () => {
  it('já começa com um CPF formatado', () => {
    const { items } = useDocumentGenerator()
    expect(items.value).toHaveLength(1)
    expect(items.value[0]).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    expect(isValidCpf(items.value[0])).toBe(true)
  })

  it('trocar o tipo gera de novo, já com a máscara certa', () => {
    const { type, items } = useDocumentGenerator()
    type.value = 'cnpj'
    expect(items.value[0]).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    expect(isValidCnpj(items.value[0])).toBe(true)

    type.value = 'cnpj-alfa'
    expect(items.value[0]).toMatch(/^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/[0-9A-Z]{4}-\d{2}$/)
    expect(items.value[0]).toMatch(/[A-Z]/)
    expect(isValidCnpj(items.value[0])).toBe(true)
  })

  it('a quantidade escolhida vira essa quantidade de documentos diferentes', () => {
    const { quantity, items } = useDocumentGenerator()
    quantity.value = 10
    expect(items.value).toHaveLength(10)
    expect(new Set(items.value).size).toBe(10)
  })

  it('tirar a pontuação não gera de novo, só muda a aparência', () => {
    const { formatted, items } = useDocumentGenerator()
    const withMask = items.value[0]
    formatted.value = false
    expect(items.value[0]).toBe(withMask.replace(/\D/g, ''))
    formatted.value = true
    expect(items.value[0]).toBe(withMask)
  })

  it('"gerar" troca os números por outros', () => {
    const { items, generate } = useDocumentGenerator()
    const before = items.value[0]
    generate()
    expect(items.value[0]).not.toBe(before)
  })
})
