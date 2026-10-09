import { describe, expect, it } from 'vitest'
import { adjust, behindLeader, byScore, finishGame, leaders, newPlayer, nextColor, parsePlayers, ranks, resetScores, winner, type Player } from '@/modules/scoreboard/lib/scoreboard'

const at = (id: number, name: string, score: number, wins = 0): Player => ({ ...newPlayer(id, name, id), score, wins })

describe('jogadores', () => {
  it('dá nome padrão e corta o nome longo', () => {
    expect(newPlayer(1, '  ', 3).name).toBe('Jogador 3')
    expect(newPlayer(1, 'a'.repeat(40), 1).name).toHaveLength(24)
  })

  it('soma e subtrai sem mexer na lista original', () => {
    const list = [newPlayer(1, 'Ana', 1), newPlayer(2, 'Bia', 2)]
    const next = adjust(list, 2, -3)
    expect(next[1].score).toBe(-3)
    expect(list[1].score).toBe(0)
    expect(resetScores(next).every((p) => p.score === 0)).toBe(true)
  })

  it('dá a quem entra a cor menos usada da mesa', () => {
    expect(nextColor([])).toBe('cobalt')
    const list = [newPlayer(1, 'A', 1, 'cobalt'), newPlayer(2, 'B', 2, 'pine')]
    expect(nextColor(list)).toBe('berry')
  })
})

describe('leaders', () => {
  const ana = at(1, 'Ana', 5)
  const bia = at(2, 'Bia', 5)
  const caio = at(3, 'Caio', 2)

  it('destaca quem lidera, inclusive empate no topo', () => {
    expect(leaders([ana, bia, caio])).toEqual([1, 2])
  })

  it('não destaca ninguém sem pontos, com um jogador só ou com todos empatados', () => {
    expect(leaders([newPlayer(1, 'A', 1), newPlayer(2, 'B', 2)])).toEqual([])
    expect(leaders([ana])).toEqual([])
    expect(leaders([ana, bia])).toEqual([])
  })
})

describe('posições', () => {
  const list = [at(1, 'Ana', 3), at(2, 'Bia', 8), at(3, 'Caio', 8), at(4, 'Duda', 1)]

  it('quem empata divide a posição e a seguinte pula', () => {
    expect([...ranks(list).entries()]).toEqual([
      [1, 3],
      [2, 1],
      [3, 1],
      [4, 4],
    ])
  })

  it('ordena do maior para o menor mantendo a ordem de entrada no empate', () => {
    expect(byScore(list).map((p) => p.id)).toEqual([2, 3, 1, 4])
  })

  it('conta quanto falta para o líder', () => {
    expect(behindLeader(list, 1)).toBe(5)
    expect(behindLeader(list, 2)).toBe(0)
  })
})

describe('winner e finishGame', () => {
  it('vence quem chega à meta sozinho no topo', () => {
    expect(winner([at(1, 'Ana', 21), at(2, 'Bia', 19)], 21)?.id).toBe(1)
    expect(winner([at(1, 'Ana', 25), at(2, 'Bia', 22)], 21)?.id).toBe(1)
  })

  it('ninguém vence sem meta, abaixo dela ou com empate no topo', () => {
    expect(winner([at(1, 'Ana', 30), at(2, 'Bia', 2)], null)).toBeNull()
    expect(winner([at(1, 'Ana', 20), at(2, 'Bia', 2)], 21)).toBeNull()
    expect(winner([at(1, 'Ana', 21), at(2, 'Bia', 21)], 21)).toBeNull()
    expect(winner([at(1, 'Ana', 21)], 21)).toBeNull()
  })

  it('fecha a partida somando a vitória e zerando os pontos', () => {
    const next = finishGame([at(1, 'Ana', 21, 2), at(2, 'Bia', 10)], 1)
    expect(next.map((p) => [p.score, p.wins])).toEqual([
      [0, 3],
      [0, 0],
    ])
  })
})

describe('parsePlayers', () => {
  it('ignora texto inválido e itens fora do formato', () => {
    expect(parsePlayers(null)).toEqual([])
    expect(parsePlayers('{')).toEqual([])
    expect(parsePlayers('[{"id":1,"name":"Ana","score":2},{"id":"x"}]')).toEqual([{ id: 1, name: 'Ana', score: 2, wins: 0, color: 'cobalt' }])
  })

  it('mantém cor e vitórias guardadas e corrige as inválidas', () => {
    expect(parsePlayers('[{"id":1,"name":"Ana","score":2,"wins":4,"color":"violet"},{"id":2,"name":"Bia","score":0,"wins":-1,"color":"red"}]')).toEqual([
      { id: 1, name: 'Ana', score: 2, wins: 4, color: 'violet' },
      { id: 2, name: 'Bia', score: 0, wins: 0, color: 'berry' },
    ])
  })
})
