import { describe, expect, it } from 'vitest'
import { DrawError, drawWinners, secureRandomInt } from '@/modules/raffle/lib/draw'

describe('secureRandomInt', () => {
  it('devolve 0 quando o limite é 1', () => {
    expect(secureRandomInt(1)).toBe(0)
  })

  it('sempre fica dentro de [0, max)', () => {
    for (let i = 0; i < 2000; i++) {
      const value = secureRandomInt(7)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(7)
    }
  })

  it('rejeita limites inválidos', () => {
    expect(() => secureRandomInt(0)).toThrow()
    expect(() => secureRandomInt(1.5)).toThrow()
  })
})

describe('drawWinners', () => {
  it('com fonte determinística que nunca troca, mantém a ordem', () => {
    // j = i em todas as iterações: cada elemento troca consigo mesmo.
    expect(drawWinners(['a', 'b', 'c'], 2, (max) => max - 1)).toEqual(['a', 'b'])
  })

  it('com fonte que sempre devolve 0, aplica o embaralhamento esperado', () => {
    // ['a','b','c'] -> i=2: troca 2<->0 => ['c','b','a'] -> i=1: troca 1<->0 => ['b','c','a']
    expect(drawWinners(['a', 'b', 'c'], 2, () => 0)).toEqual(['b', 'c'])
  })

  it('não altera a lista original', () => {
    const participants = ['a', 'b', 'c']
    drawWinners(participants, 3, () => 0)
    expect(participants).toEqual(['a', 'b', 'c'])
  })

  it('não repete vencedores quando os nomes são distintos', () => {
    const winners = drawWinners(['a', 'b', 'c', 'd', 'e'], 5)
    expect(new Set(winners).size).toBe(5)
  })

  it('trata nomes repetidos como entradas independentes', () => {
    expect(drawWinners(['Ana', 'Ana'], 2)).toEqual(['Ana', 'Ana'])
  })

  it('lança EMPTY com lista vazia', () => {
    expect(() => drawWinners([], 1)).toThrow(DrawError)
    try {
      drawWinners([], 1)
    } catch (error) {
      expect((error as DrawError).code).toBe('EMPTY')
    }
  })

  it.each([0, -1, 1.5, Number.NaN])('lança INVALID_COUNT para count=%s', (count) => {
    try {
      drawWinners(['a', 'b'], count)
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(DrawError)
      expect((error as DrawError).code).toBe('INVALID_COUNT')
    }
  })

  it('lança INVALID_COUNT quando count excede os participantes e informa quantos restam', () => {
    try {
      drawWinners(['a', 'b'], 3)
      expect.unreachable()
    } catch (error) {
      expect((error as DrawError).code).toBe('INVALID_COUNT')
      expect((error as DrawError).message).toMatch(/restam apenas 2/i)
    }
  })
})
