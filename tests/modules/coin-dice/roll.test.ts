import { describe, expect, it } from 'vitest'
import { diceNotation, flipCoin, rollDice } from '@/modules/coin-dice/lib/roll'

describe('flipCoin', () => {
  it('0 é cara e 1 é coroa', () => {
    expect(flipCoin(() => 0)).toBe('heads')
    expect(flipCoin(() => 1)).toBe('tails')
  })

  it('os dois lados saem de forma equilibrada', () => {
    const results = Array.from({ length: 2000 }, () => flipCoin())
    const heads = results.filter((side) => side === 'heads').length
    expect(heads).toBeGreaterThan(850)
    expect(heads).toBeLessThan(1150)
  })
})

describe('rollDice', () => {
  it('cada dado fica entre 1 e o número de faces e o total soma', () => {
    for (let i = 0; i < 200; i++) {
      const roll = rollDice(3, 6)
      expect(roll.rolls).toHaveLength(3)
      for (const value of roll.rolls) {
        expect(value).toBeGreaterThanOrEqual(1)
        expect(value).toBeLessThanOrEqual(6)
      }
      expect(roll.total).toBe(roll.rolls.reduce((a, b) => a + b, 0))
    }
  })

  it('usa o sorteador recebido: 0 dá 1 e faces-1 dá o máximo', () => {
    expect(rollDice(2, 20, () => 0)).toEqual({ sides: 20, rolls: [1, 1], total: 2 })
    expect(rollDice(1, 100, (max) => max - 1).total).toBe(100)
  })

  it('todas as faces aparecem', () => {
    const seen = new Set(Array.from({ length: 500 }, () => rollDice(1, 4).total))
    expect([...seen].sort()).toEqual([1, 2, 3, 4])
  })

  it('valida quantidade e faces', () => {
    expect(() => rollDice(0, 6)).toThrow('dados')
    expect(() => rollDice(11, 6)).toThrow('dados')
    expect(() => rollDice(1.5, 6)).toThrow('dados')
    expect(() => rollDice(1, 7)).toThrow('existe')
  })
})

describe('diceNotation', () => {
  it('escreve no formato dos jogos', () => {
    expect(diceNotation(2, 6)).toBe('2d6')
  })
})
