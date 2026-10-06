import { describe, expect, it } from 'vitest'
import { useRaffle } from '@/modules/raffle/composables/useRaffle'

// Fonte sem trocas: o sorteio devolve os primeiros nomes da lista, em ordem.
const noSwap = (max: number) => max - 1

describe('useRaffle', () => {
  it('bloqueia o sorteio com a lista vazia e informa o motivo', () => {
    const raffle = useRaffle(noSwap)
    expect(raffle.canDraw.value).toBe(false)
    expect(raffle.drawError.value).toBe('Adicione pelo menos um nome.')
    expect(raffle.draw()).toBeNull()
  })

  it('trata entrada com quebras do Windows e linhas em branco', () => {
    const raffle = useRaffle(noSwap)
    raffle.rawInput.value = 'Ana\r\n\r\nBruno\r\n   \r\n'
    expect(raffle.parsed.value.names).toEqual(['Ana', 'Bruno'])
  })

  it('sorteia, guarda a rodada e a coloca no topo do histórico', () => {
    const raffle = useRaffle(noSwap)
    raffle.rawInput.value = 'Ana\nBruno\nCarla'
    const round = raffle.draw()
    expect(round?.winners).toEqual(['Ana'])
    expect(round?.participants).toEqual(['Ana', 'Bruno', 'Carla'])
    expect(raffle.history.value).toHaveLength(1)
    expect(raffle.currentRound.value).toEqual(round)
  })

  it('mantém a lista quando "sem repetição" está desligado', () => {
    const raffle = useRaffle(noSwap)
    raffle.rawInput.value = 'Ana\nBruno'
    raffle.draw()
    expect(raffle.rawInput.value).toBe('Ana\nBruno')
  })

  it('remove apenas uma ocorrência do vencedor no modo "sem repetição"', () => {
    const raffle = useRaffle(noSwap)
    raffle.noRepeat.value = true
    raffle.rawInput.value = 'Ana\nana\nBruno'
    raffle.draw()
    expect(raffle.rawInput.value).toBe('ana\nBruno')
  })

  it('informa quantos nomes restam quando pedem vencedores demais', () => {
    const raffle = useRaffle(noSwap)
    raffle.rawInput.value = 'Ana\nBruno'
    raffle.winnerCount.value = 3
    expect(raffle.canDraw.value).toBe(false)
    expect(raffle.drawError.value).toBe('Restam apenas 2 nomes para sortear.')
    expect(raffle.draw()).toBeNull()
  })

  it('após rodadas sem repetição, bloqueia quando a lista esgota', () => {
    const raffle = useRaffle(noSwap)
    raffle.noRepeat.value = true
    raffle.rawInput.value = 'Ana\nBruno'
    raffle.draw()
    raffle.draw()
    expect(raffle.history.value.map((r) => r.winners[0])).toEqual(['Bruno', 'Ana'])
    expect(raffle.canDraw.value).toBe(false)
    expect(raffle.drawError.value).toBe('Adicione pelo menos um nome.')
  })

  it('trata campo numérico vazio ou inválido sem lançar exceção', () => {
    const raffle = useRaffle(noSwap)
    raffle.rawInput.value = 'Ana'
    raffle.winnerCount.value = Number.NaN
    expect(raffle.canDraw.value).toBe(false)
    expect(raffle.drawError.value).toBe('Informe ao menos 1 vencedor.')
    expect(raffle.draw()).toBeNull()
  })

  it('limpa o histórico', () => {
    const raffle = useRaffle(noSwap)
    raffle.rawInput.value = 'Ana\nBruno'
    raffle.draw()
    raffle.clearHistory()
    expect(raffle.history.value).toEqual([])
  })
})
