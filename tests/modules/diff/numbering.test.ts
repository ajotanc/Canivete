import { describe, expect, it } from 'vitest'
import { diffText, type DiffOptions } from '@/modules/diff/lib/diff'

const strict: DiffOptions = { ignoreCase: false, ignoreSpaces: false }

/** Gerador pseudoaleatório fixo, para o teste ser repetível. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

function randomLines(random: () => number): string[] {
  const length = Math.floor(random() * 12)
  return Array.from({ length }, () => ['a', 'b', 'c', 'd', 'e', 'f'][Math.floor(random() * 6)])
}

const sequence = (length: number): number[] => Array.from({ length }, (_, index) => index + 1)

describe('numeração das linhas', () => {
  it('as linhas do original e do novo saem numeradas de 1 até o fim, em ordem, sem pular nem repetir', () => {
    const random = rng(42)
    for (let round = 0; round < 400; round++) {
      const original = randomLines(random)
      const changed = randomLines(random)
      const { rows } = diffText(original.join('\n'), changed.join('\n'), strict)

      expect(rows.filter((row) => row.type !== 'add').map((row) => row.oldNumber), `original ${JSON.stringify(original)}`).toEqual(sequence(original.length))
      expect(rows.filter((row) => row.type !== 'remove').map((row) => row.newNumber), `novo ${JSON.stringify(changed)}`).toEqual(sequence(changed.length))

      // Remontando os textos a partir das linhas, saem exatamente o original e o novo.
      expect(rows.filter((row) => row.type !== 'add').map((row) => (row.type === 'equal' ? original[row.oldNumber! - 1] : row.text))).toEqual(original)
      expect(rows.filter((row) => row.type !== 'remove').map((row) => row.text)).toEqual(changed)

      // Linha nova não tem número do original; removida não tem número do novo; igual tem os dois.
      for (const row of rows) {
        expect(row.oldNumber !== undefined).toBe(row.type !== 'add')
        expect(row.newNumber !== undefined).toBe(row.type !== 'remove')
      }
    }
  })

  it('com ignorar maiúsculas e espaços, linhas em branco e quebras do Windows, a numeração também fecha', () => {
    const random = rng(7)
    const pieces = ['a', 'A', ' a ', 'b', '', '  ', 'B b', 'b  b']
    const options: DiffOptions[] = [
      { ignoreCase: true, ignoreSpaces: false },
      { ignoreCase: false, ignoreSpaces: true },
      { ignoreCase: true, ignoreSpaces: true },
    ]
    for (let round = 0; round < 300; round++) {
      const make = () => Array.from({ length: Math.floor(random() * 10) }, () => pieces[Math.floor(random() * pieces.length)])
      const original = make()
      const changed = make()
      const newline = random() < 0.5 ? '\r\n' : '\n'
      const originalText = original.join(newline)
      const changedText = changed.join('\n')
      const { rows } = diffText(originalText, changedText, options[round % options.length])
      // Texto totalmente vazio é zero linhas; qualquer outro tem uma linha por quebra, mais uma.
      const expectedOld = originalText === '' ? 0 : original.length
      const expectedNew = changedText === '' ? 0 : changed.length
      expect(rows.filter((row) => row.type !== 'add').map((row) => row.oldNumber)).toEqual(sequence(expectedOld))
      expect(rows.filter((row) => row.type !== 'remove').map((row) => row.newNumber)).toEqual(sequence(expectedNew))
    }
  })
})
