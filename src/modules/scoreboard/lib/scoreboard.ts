/** Cores de jogador: as mesmas cores de cabo do app, aplicadas com `data-tool` no cartão de cada um. */
export const PLAYER_COLORS = ['cobalt', 'berry', 'pine', 'violet', 'amber'] as const
export type PlayerColor = (typeof PLAYER_COLORS)[number]

export interface Player {
  id: number
  name: string
  score: number
  /** Partidas ganhas desde que o jogador entrou no placar. */
  wins: number
  color: PlayerColor
}

export const MAX_PLAYERS = 12
export const MAX_NAME = 24
export const MAX_TARGET = 999

/** Cor do jogador na posição (1, 2, 3…), em rodízio. */
export const colorAt = (position: number): PlayerColor => PLAYER_COLORS[(Math.max(position, 1) - 1) % PLAYER_COLORS.length]

/** A cor menos usada na mesa (na ordem da paleta), para quem entra agora não repetir a de outro jogador. */
export function nextColor(players: readonly Player[]): PlayerColor {
  const counts = PLAYER_COLORS.map((color) => players.filter((player) => player.color === color).length)
  return PLAYER_COLORS[counts.indexOf(Math.min(...counts))]
}

/** Jogador novo com nome limpo; sem nome vira "Jogador N". */
export function newPlayer(id: number, name: string, position: number, color: PlayerColor = colorAt(position)): Player {
  const clean = name.trim().slice(0, MAX_NAME)
  return { id, name: clean || `Jogador ${position}`, score: 0, wins: 0, color }
}

/** Soma (ou subtrai, se negativo) pontos de um jogador, sem mexer na lista original. */
export const adjust = (players: readonly Player[], id: number, delta: number): Player[] => players.map((player) => (player.id === id ? { ...player, score: player.score + delta } : player))

/** Zera os pontos, mantendo os jogadores e as vitórias. */
export const resetScores = (players: readonly Player[]): Player[] => players.map((player) => ({ ...player, score: 0 }))

/** Fecha a partida: soma uma vitória para quem ganhou (se houver) e zera os pontos de todos. */
export const finishGame = (players: readonly Player[], winnerId: number | null): Player[] =>
  players.map((player) => ({ ...player, score: 0, wins: player.wins + (player.id === winnerId ? 1 : 0) }))

/** Ids de quem está na frente. Vazio se ninguém marcou ponto ou se todos empatam no topo com a lista inteira. */
export function leaders(players: readonly Player[]): number[] {
  if (players.length < 2) return []
  const top = Math.max(...players.map((player) => player.score))
  if (top <= 0) return []
  const ahead = players.filter((player) => player.score === top)
  return ahead.length === players.length ? [] : ahead.map((player) => player.id)
}

/** Posição de cada jogador pelos pontos; quem empata divide a posição (1º, 1º, 3º). */
export function ranks(players: readonly Player[]): Map<number, number> {
  const result = new Map<number, number>()
  for (const player of players) result.set(player.id, players.filter((other) => other.score > player.score).length + 1)
  return result
}

/** Lista do maior para o menor placar; no empate, quem entrou antes vem primeiro. */
export const byScore = (players: readonly Player[]): Player[] => [...players].sort((a, b) => b.score - a.score || players.indexOf(a) - players.indexOf(b))

/** Quantos pontos faltam para alcançar quem está na frente (0 para quem lidera). */
export function behindLeader(players: readonly Player[], id: number): number {
  const player = players.find((item) => item.id === id)
  if (!player || players.length === 0) return 0
  return Math.max(...players.map((item) => item.score)) - player.score
}

/**
 * Quem venceu a partida: o único que chegou à meta com o maior placar.
 * Sem meta, com um jogador só ou com empate no topo (desempate pendente), ninguém venceu ainda.
 */
export function winner(players: readonly Player[], target: number | null): Player | null {
  if (!target || players.length < 2) return null
  const top = Math.max(...players.map((player) => player.score))
  if (top < target) return null
  const best = players.filter((player) => player.score === top)
  return best.length === 1 ? best[0] : null
}

/** Lê a lista guardada, ignorando qualquer coisa fora do formato. Listas antigas (sem cor e vitórias) ganham os padrões. */
export function parsePlayers(text: string | null): Player[] {
  if (!text) return []
  try {
    const data: unknown = JSON.parse(text)
    if (!Array.isArray(data)) return []
    return data
      .filter((item): item is Player => !!item && typeof item.id === 'number' && typeof item.name === 'string' && typeof item.score === 'number' && Number.isFinite(item.score))
      .slice(0, MAX_PLAYERS)
      .map((item, index) => ({
        id: item.id,
        name: item.name,
        score: item.score,
        wins: Number.isInteger(item.wins) && item.wins > 0 ? item.wins : 0,
        color: PLAYER_COLORS.includes(item.color) ? item.color : colorAt(index + 1),
      }))
  } catch {
    return []
  }
}
