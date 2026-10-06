import { computed, ref } from 'vue'
import { drawWinners, type RandomInt } from '../lib/draw'
import { parseNames, removeNames, validateNames } from '../lib/names'

export interface Round {
  id: number
  drawnAt: string
  /** Lista usada no sorteio (antes da remoção dos vencedores, se houver). */
  participants: string[]
  winners: string[]
}

/** Estado e ações da tela do sorteador. A fonte de aleatoriedade é injetável para testes. */
export function useRaffle(randomInt?: RandomInt) {
  const rawInput = ref('')
  const winnerCount = ref(1)
  const noRepeat = ref(false)
  const history = ref<Round[]>([])
  const currentRound = ref<Round | null>(null)
  let nextId = 1

  const parsed = computed(() => parseNames(rawInput.value))

  /** Mensagem em português do que impede o sorteio agora, ou null se está tudo certo. */
  const drawError = computed<string | null>(() => {
    const inputError = validateNames(parsed.value)
    if (inputError) return inputError
    if (!Number.isInteger(winnerCount.value) || winnerCount.value < 1) {
      return 'Informe ao menos 1 vencedor.'
    }
    if (winnerCount.value > parsed.value.names.length) {
      return `Restam apenas ${parsed.value.names.length} nomes para sortear.`
    }
    return null
  })

  const canDraw = computed(() => drawError.value === null)

  /** Realiza um sorteio. Devolve a rodada, ou null se não for possível sortear. */
  function draw(): Round | null {
    if (drawError.value) return null

    const participants = [...parsed.value.names]
    const winners = drawWinners(participants, winnerCount.value, randomInt)
    const round: Round = {
      id: nextId++,
      drawnAt: new Date().toISOString(),
      participants,
      winners,
    }

    history.value.unshift(round)
    currentRound.value = round
    if (noRepeat.value) rawInput.value = removeNames(rawInput.value, winners)
    return round
  }

  function clearHistory() {
    history.value = []
  }

  return { rawInput, winnerCount, noRepeat, history, currentRound, parsed, drawError, canDraw, draw, clearHistory }
}
