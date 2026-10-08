import { describe, expect, it } from 'vitest'
import { CLASSIC_START, generateLorem, randomSentence, randomWords, type LoremOptions } from '@/modules/lorem/lib/lorem'

const base: LoremOptions = { unit: 'paragraphs', count: 3, language: 'latin', classicStart: false, html: false }
const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length

describe('generateLorem', () => {
  it('gera a quantidade de parágrafos pedida, separados por linha em branco', () => {
    const text = generateLorem(base)
    expect(text.split('\n\n')).toHaveLength(3)
    for (const paragraph of text.split('\n\n')) expect(paragraph).toMatch(/^[A-Z].*\.$/)
  })

  it('gera a quantidade de frases pedida', () => {
    const text = generateLorem({ ...base, unit: 'sentences', count: 5 })
    expect(text.match(/\./g)).toHaveLength(5)
  })

  it('gera a quantidade exata de palavras', () => {
    expect(wordCount(generateLorem({ ...base, unit: 'words', count: 17 }))).toBe(17)
    expect(generateLorem({ ...base, unit: 'words', count: 1 })).toMatch(/^[A-Z][a-zçãé]+$/)
  })

  it('começa com a frase clássica quando pedido', () => {
    expect(generateLorem({ ...base, classicStart: true }).startsWith(CLASSIC_START)).toBe(true)
    expect(generateLorem({ ...base, unit: 'sentences', classicStart: true }).startsWith(CLASSIC_START)).toBe(true)
    expect(generateLorem({ ...base, unit: 'words', count: 7, classicStart: true }).startsWith('Lorem ipsum dolor sit amet')).toBe(true)
    expect(wordCount(generateLorem({ ...base, unit: 'words', count: 7, classicStart: true }))).toBe(7)
  })

  it('a frase clássica só vale em latim', () => {
    expect(generateLorem({ ...base, language: 'pt', classicStart: true })).not.toContain('Lorem ipsum')
  })

  it('embrulha em <p> no modo HTML', () => {
    const lines = generateLorem({ ...base, html: true }).split('\n')
    expect(lines).toHaveLength(3)
    for (const line of lines) expect(line).toMatch(/^<p>.+<\/p>$/)
  })

  it('limita a quantidade entre 1 e 100', () => {
    expect(generateLorem({ ...base, unit: 'words', count: 0 }).split(' ')).toHaveLength(1)
    expect(wordCount(generateLorem({ ...base, unit: 'words', count: 5000 }))).toBe(100)
  })
})

describe('peças', () => {
  it('uma frase tem de 6 a 14 palavras e termina em ponto', () => {
    for (let i = 0; i < 100; i++) {
      const sentence = randomSentence('pt')
      expect(wordCount(sentence)).toBeGreaterThanOrEqual(6)
      expect(wordCount(sentence)).toBeLessThanOrEqual(14)
      expect(sentence.endsWith('.')).toBe(true)
    }
  })

  it('não repete a mesma palavra em seguida', () => {
    for (let i = 0; i < 50; i++) {
      const words = randomWords(30, 'latin', (max) => Math.floor(Math.random() * max))
      words.forEach((word, index) => index > 0 && expect(word).not.toBe(words[index - 1]))
    }
  })
})
