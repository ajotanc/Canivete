import { describe, expect, it } from 'vitest'
import { assignSecretFriends } from '../../../functions/secret-santa/src/lib/draw'
import { secureRandomInt } from '../../../functions/secret-santa/src/lib/random'

const ids = ['a', 'b', 'c', 'd', 'e']

describe('secureRandomInt', () => {
  it('fica dentro de [0, max) e rejeita limites inválidos', () => {
    for (let i = 0; i < 1000; i++) {
      const value = secureRandomInt(7)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(7)
    }
    expect(() => secureRandomInt(0)).toThrow()
  })
})

describe('assignSecretFriends', () => {
  it('com fonte sem trocas, a roda segue a ordem da lista', () => {
    const result = assignSecretFriends(['a', 'b', 'c'], (max) => max - 1)
    expect([...result.entries()]).toEqual([
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'a'],
    ])
  })

  it('ninguém tira a si mesmo, cada um dá e recebe exatamente uma vez', () => {
    for (let i = 0; i < 200; i++) {
      const result = assignSecretFriends(ids)
      expect(result.size).toBe(ids.length)
      for (const [giver, receiver] of result) expect(giver).not.toBe(receiver)
      expect(new Set(result.keys())).toEqual(new Set(ids))
      expect(new Set(result.values())).toEqual(new Set(ids))
    }
  })

  it('forma uma roda única (seguindo os pares, passa por todos antes de voltar)', () => {
    for (let i = 0; i < 100; i++) {
      const result = assignSecretFriends(ids)
      let current = ids[0]
      const visited = new Set<string>()
      do {
        visited.add(current)
        current = result.get(current)!
      } while (current !== ids[0])
      expect(visited.size).toBe(ids.length)
    }
  })

  it('funciona com exatamente 3 participantes', () => {
    const result = assignSecretFriends(['x', 'y', 'z'])
    for (const [giver, receiver] of result) expect(giver).not.toBe(receiver)
  })

  it.each([[[]], [['a']], [['a', 'b']]])('recusa menos de 3 participantes: %j', (list) => {
    expect(() => assignSecretFriends(list)).toThrowError(/pelo menos 3/)
    try {
      assignSecretFriends(list)
    } catch (error) {
      expect((error as { code: string }).code).toBe('NOT_ENOUGH_PARTICIPANTS')
    }
  })

  it('não altera a lista recebida', () => {
    const input = ['a', 'b', 'c']
    assignSecretFriends(input)
    expect(input).toEqual(['a', 'b', 'c'])
  })
})
