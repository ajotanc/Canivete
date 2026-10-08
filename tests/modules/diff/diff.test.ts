import { describe, expect, it } from 'vitest'
import { diffText, MAX_CELLS, toUnified, wordDiff, type DiffOptions } from '@/modules/diff/lib/diff'

const strict: DiffOptions = { ignoreCase: false, ignoreSpaces: false }
const types = (original: string, changed: string, options = strict) => diffText(original, changed, options).rows.map((row) => row.type)

describe('diffText', () => {
  it('textos iguais só têm linhas iguais', () => {
    const result = diffText('a\nb\nc', 'a\nb\nc', strict)
    expect(result).toMatchObject({ added: 0, removed: 0, equal: 3 })
    expect(types('a\nb\nc', 'a\nb\nc')).toEqual(['equal', 'equal', 'equal'])
  })

  it('acha linha acrescentada e removida', () => {
    expect(types('a\nc', 'a\nb\nc')).toEqual(['equal', 'add', 'equal'])
    expect(types('a\nb\nc', 'a\nc')).toEqual(['equal', 'remove', 'equal'])
  })

  it('numera as linhas em cada texto', () => {
    const { rows } = diffText('a\nb\nc', 'a\nc\nd', strict)
    expect(rows.map((row) => [row.type, row.oldNumber, row.newNumber])).toEqual([
      ['equal', 1, 1],
      ['remove', 2, undefined],
      ['equal', 3, 2],
      ['add', undefined, 3],
    ])
  })

  it('linha trocada vira remoção e adição lado a lado, com as palavras marcadas', () => {
    const { rows } = diffText('o gato preto', 'o gato branco', strict)
    expect(rows.map((row) => row.type)).toEqual(['remove', 'add'])
    expect(rows[0].parts).toEqual([{ text: 'o gato ', changed: false }, { text: 'preto', changed: true }])
    expect(rows[1].parts).toEqual([{ text: 'o gato ', changed: false }, { text: 'branco', changed: true }])
  })

  it('só marca palavras quando há uma linha parecida do outro lado', () => {
    const { rows } = diffText('a\nb', 'a\nb\nc', strict)
    expect(rows[2]).toMatchObject({ type: 'add', text: 'c' })
    expect(rows[2].parts).toBeUndefined()
  })

  it('texto vazio de um lado é tudo acrescentado ou removido', () => {
    expect(diffText('', 'a\nb', strict)).toMatchObject({ added: 2, removed: 0, equal: 0 })
    expect(diffText('a\nb', '', strict)).toMatchObject({ added: 0, removed: 2, equal: 0 })
    expect(diffText('', '', strict).rows).toEqual([])
  })

  it('trata quebras de linha do Windows e do Mac como iguais', () => {
    expect(diffText('a\r\nb', 'a\nb', strict)).toMatchObject({ added: 0, removed: 0, equal: 2 })
  })

  it('ignora maiúsculas quando pedido', () => {
    expect(types('Olá', 'olá')).toEqual(['remove', 'add'])
    expect(types('Olá', 'olá', { ignoreCase: true, ignoreSpaces: false })).toEqual(['equal'])
  })

  it('ignora espaços sobrando quando pedido', () => {
    expect(types('a  b', ' a b ')).toEqual(['remove', 'add'])
    expect(types('a  b', ' a b ', { ignoreCase: false, ignoreSpaces: true })).toEqual(['equal'])
  })

  it('as linhas iguais mostram o texto novo', () => {
    const result = diffText('Olá', 'olá', { ignoreCase: true, ignoreSpaces: false })
    expect(result.rows[0].text).toBe('olá')
  })

  it('a soma das linhas fecha com os dois textos', () => {
    const original = Array.from({ length: 40 }, (_, index) => `linha ${index}`).join('\n')
    const changed = Array.from({ length: 45 }, (_, index) => (index % 7 === 0 ? `nova ${index}` : `linha ${index}`)).join('\n')
    const result = diffText(original, changed, strict)
    expect(result.equal + result.removed).toBe(40)
    expect(result.equal + result.added).toBe(45)
  })

  it('recusa textos grandes demais', () => {
    const big = Array.from({ length: Math.ceil(Math.sqrt(MAX_CELLS)) + 10 }, (_, index) => String(index)).join('\n')
    expect(() => diffText(big, big, strict)).toThrow('grandes demais')
  })
})

describe('wordDiff', () => {
  it('junta palavras vizinhas que mudaram numa parte só', () => {
    const { before, after } = wordDiff('um dois três quatro', 'um DOIS TRÊS quatro', strict)
    expect(before).toEqual([{ text: 'um ', changed: false }, { text: 'dois três', changed: true }, { text: ' quatro', changed: false }])
    expect(after).toEqual([{ text: 'um ', changed: false }, { text: 'DOIS TRÊS', changed: true }, { text: ' quatro', changed: false }])
  })

  it('palavra acrescentada aparece só no lado novo', () => {
    const { before, after } = wordDiff('a b', 'a x b', strict)
    expect(before.every((part) => !part.changed)).toBe(true)
    expect(after.filter((part) => part.changed).map((part) => part.text)).toEqual(['x '])
  })
})

describe('pontuação', () => {
  it('só o ponto muda quando a palavra é a mesma', () => {
    const { before, after } = wordDiff('João Júnior Silva.', 'João Júnior Silva', strict)
    expect(before).toEqual([{ text: 'João Júnior Silva', changed: false }, { text: '.', changed: true }])
    expect(after).toEqual([{ text: 'João Júnior Silva', changed: false }])
  })

  it('separa vírgula, aspas e parênteses das palavras', () => {
    const { before } = wordDiff('olá, mundo (ok)', 'olá mundo ok', strict)
    expect(before.filter((part) => part.changed).map((part) => part.text)).toEqual([',', '(', ')'])
  })

  it('acentos e números ficam dentro da palavra', () => {
    const { before, after } = wordDiff('ação 42', 'ação 43', strict)
    expect(before.filter((part) => part.changed).map((part) => part.text)).toEqual(['42'])
    expect(after.filter((part) => part.changed).map((part) => part.text)).toEqual(['43'])
  })
})

describe('toUnified', () => {
  it('prefixa as linhas com +, - ou espaço', () => {
    const { rows } = diffText('a\nb', 'a\nc', strict)
    expect(toUnified(rows)).toBe('  a\n- b\n+ c')
  })
})
