import { describe, expect, it } from 'vitest'
import { isValidCpf } from '@/modules/cpf-cnpj/lib/document'
import { FIELD_LABELS, generatePerson, peopleToJson } from '@/modules/fake-data/lib/person'

describe('generatePerson', () => {
  it('gera todos os campos no formato esperado', () => {
    for (let i = 0; i < 30; i++) {
      const person = generatePerson()
      expect(person.name).toMatch(/^\S+ \S+$/)
      expect(person.cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
      expect(isValidCpf(person.cpf)).toBe(true)
      expect(person.email).toMatch(/^[a-z]+\.[a-z]+\d{2}@example\.com$/)
      expect(person.phone).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/)
      expect(person.birthDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
      expect(person.cep).toMatch(/^\d{5}-\d{3}$/)
      expect(person.state).toMatch(/^[A-Z]{2}$/)
    }
  })

  it('só gera maiores de idade', () => {
    const now = new Date(2026, 5, 1)
    for (let i = 0; i < 50; i++) {
      const year = Number(generatePerson(undefined, now).birthDate.slice(-4))
      expect(year).toBeLessThanOrEqual(2026 - 18)
      expect(year).toBeGreaterThanOrEqual(2026 - 70)
    }
  })

  it('o e-mail não tem acento', () => {
    for (let i = 0; i < 100; i++) expect(generatePerson().email).toMatch(/^[\x00-\x7F]+$/)
  })

  it('usa o gerador de números recebido', () => {
    const sequence = () => {
      let n = 0
      return (max: number) => n++ % max
    }
    const now = new Date(2026, 0, 1)
    const person = generatePerson(sequence(), now)
    expect(person).toEqual(generatePerson(sequence(), now))
    expect(person.name).toBe('Ana Alves')
  })
})

describe('apoio', () => {
  it('rotula todos os campos da pessoa', () => {
    expect(FIELD_LABELS.map((field) => field.key).sort()).toEqual(Object.keys(generatePerson()).sort())
  })

  it('JSON de uma pessoa é um objeto; de várias, uma lista', () => {
    const person = generatePerson()
    expect(JSON.parse(peopleToJson([person]))).toEqual(person)
    expect(JSON.parse(peopleToJson([person, person]))).toHaveLength(2)
  })
})
