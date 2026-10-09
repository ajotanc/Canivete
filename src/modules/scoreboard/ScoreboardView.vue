<script setup lang="ts">
import { Flag, Maximize, Minimize, RotateCcw, Trophy, Undo2, UserPlus, Users, Zap } from '@lucide/vue'
import { onKeyStroke, useFullscreen, useStorage } from '@vueuse/core'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import NumberInput from '@/components/NumberInput.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { triggerConfetti } from '@/core/effects/confetti'
import { play } from '@/core/effects/sound'
import PlayerCard from './components/PlayerCard.vue'
import {
  adjust,
  behindLeader,
  byScore,
  finishGame,
  leaders,
  MAX_NAME,
  MAX_PLAYERS,
  MAX_TARGET,
  newPlayer,
  nextColor,
  parsePlayers,
  ranks,
  resetScores,
  winner,
  type Player,
} from './lib/scoreboard'

const STORAGE_KEY = 'canivete:scoreboard'
/** Quantas jogadas o "Desfazer" lembra. */
const HISTORY_LIMIT = 100
/** Toques seguidos no mesmo jogador dentro deste tempo somam no mesmo "+N". */
const DELTA_MS = 1200

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const players = ref<Player[]>(parsePlayers(read()))
const name = ref('')
const step = useStorage('canivete:scoreboard:step', 1)
const useTarget = useStorage('canivete:scoreboard:use-target', false)
const targetValue = useStorage('canivete:scoreboard:target', 21)
const sorted = useStorage('canivete:scoreboard:sorted', false)
let nextId = players.value.reduce((max, player) => Math.max(max, player.id), 0) + 1

// O placar fica salvo no aparelho; se o navegador não deixar gravar, ele segue funcionando só nesta aba.
watch(
  players,
  (list) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    } catch {
      /* sem armazenamento */
    }
  },
  { deep: true },
)

// Cada mudança guarda o placar anterior, para o "Desfazer" voltar uma jogada de cada vez.
const history = ref<Player[][]>([])
function commit(next: Player[]) {
  history.value = [...history.value.slice(-(HISTORY_LIMIT - 1)), players.value]
  players.value = next
}
function undo() {
  const previous = history.value.at(-1)
  if (!previous) return
  history.value = history.value.slice(0, -1)
  players.value = previous
  play('tap')
}

const target = computed(() => (useTarget.value ? targetValue.value : null))
const full = computed(() => players.value.length >= MAX_PLAYERS)
const ahead = computed(() => leaders(players.value))
const positions = computed(() => ranks(players.value))
const hasScore = computed(() => players.value.some((player) => player.score !== 0))
const champion = computed(() => winner(players.value, target.value))
const shown = computed(() => (sorted.value ? byScore(players.value) : players.value))

function add() {
  if (full.value) return
  commit([...players.value, newPlayer(nextId++, name.value, players.value.length + 1, nextColor(players.value))])
  name.value = ''
}

// O "+5" que sobe ao lado do placar: toques seguidos no mesmo jogador vão somando.
const deltas = reactive(new Map<number, { value: number; key: number }>())
const deltaTimers = new Map<number, ReturnType<typeof setTimeout>>()
let deltaKey = 0
function showDelta(id: number, amount: number) {
  const current = deltaTimers.has(id) ? (deltas.get(id)?.value ?? 0) : 0
  deltas.set(id, { value: current + amount, key: ++deltaKey })
  clearTimeout(deltaTimers.get(id))
  deltaTimers.set(
    id,
    setTimeout(() => {
      deltas.delete(id)
      deltaTimers.delete(id)
    }, DELTA_MS),
  )
}
onBeforeUnmount(() => deltaTimers.forEach((timer) => clearTimeout(timer)))

function change(id: number, sign: 1 | -1) {
  const amount = sign * step.value
  commit(adjust(players.value, id, amount))
  showDelta(id, amount)
  play('tap')
}

const removing = ref<Player | null>(null)
const removeOpen = computed({
  get: () => removing.value !== null,
  set: (open) => {
    if (!open) removing.value = null
  },
})
function confirmRemove() {
  const id = removing.value?.id
  removing.value = null
  if (id !== undefined) commit(players.value.filter((player) => player.id !== id))
}

const reset = () => commit(resetScores(players.value))
function newGame() {
  commit(finishGame(players.value, champion.value?.id ?? null))
  play('tap')
}

// Alguém chegou à meta na frente de todos: som de vitória e confete nas cores do vencedor.
watch(
  () => champion.value?.id,
  (id, before) => {
    if (id === undefined || id === before) return
    play('win')
    const color = getComputedStyle(document.documentElement).getPropertyValue(`--${champion.value?.color}`).trim()
    triggerConfetti(color ? { colors: [color, '#F2B600', '#FFFFFF'] } : {})
  },
)

// Modo telão: o placar ocupa a tela inteira (e pede tela cheia ao navegador, quando ele deixa).
const big = ref(false)
const { isFullscreen, isSupported, enter, exit } = useFullscreen()
async function toggleBig() {
  big.value = !big.value
  if (!isSupported.value) return
  try {
    if (big.value) await enter()
    else if (isFullscreen.value) await exit()
  } catch {
    // Sem tela cheia: o placar segue ocupando a janela.
  }
}
watch(isFullscreen, (now, before) => {
  if (before && !now) big.value = false
})
onKeyStroke('Escape', () => {
  if (big.value && !isFullscreen.value) big.value = false
})
watch(big, (open) => document.body.classList.toggle('overflow-hidden', open))
onBeforeUnmount(() => {
  document.body.classList.remove('overflow-hidden')
  if (isFullscreen.value) void exit()
})
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Trophy" title="Placar" description="Marque os pontos de cada jogador, jogue até uma meta e veja quem está na frente. Fica salvo neste aparelho.">
      <FactList>
        <FactTile :icon="Users" label="Jogadores">{{ players.length }} de {{ MAX_PLAYERS }}</FactTile>
        <FactTile :icon="Flag" label="Meta">{{ target ? `${target} pts` : 'Livre' }}</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Jogadores</CardTitle>
            <CardDescription>Cada jogador ganha uma cor. Até {{ MAX_PLAYERS }} na mesa.</CardDescription>
          </CardHeader>
          <CardContent>
            <form class="space-y-4" @submit.prevent="add">
              <Field>
                <FieldLabel for="player">Nome</FieldLabel>
                <Input id="player" v-model="name" :maxlength="MAX_NAME" autocomplete="off" :placeholder="`Jogador ${players.length + 1}`" :disabled="full" />
              </Field>
              <Button type="submit" size="lg" class="w-full" :disabled="full"><UserPlus aria-hidden="true" />{{ full ? 'Mesa cheia' : 'Adicionar jogador' }}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Partida</CardTitle>
            <CardDescription>Quanto vale cada toque e até onde vai o jogo.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-5">
            <Field orientation="horizontal">
              <FieldLabel for="step">Pontos por toque</FieldLabel>
              <NumberInput id="step" v-model="step" :min="1" :max="100" />
            </Field>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel for="use-target">Jogar até uma meta</FieldLabel>
                <FieldDescription>Quem chegar primeiro, na frente de todos, vence.</FieldDescription>
              </FieldContent>
              <Switch id="use-target" v-model="useTarget" />
            </Field>
            <Field v-if="useTarget" orientation="horizontal">
              <FieldLabel for="target">Meta</FieldLabel>
              <NumberInput id="target" v-model="targetValue" :min="1" :max="MAX_TARGET" />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel for="sorted">Ordenar por pontos</FieldLabel>
              <Switch id="sorted" v-model="sorted" />
            </Field>
            <div class="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" :disabled="history.length === 0" @click="undo"><Undo2 aria-hidden="true" />Desfazer</Button>
              <Button type="button" variant="outline" :disabled="!hasScore" @click="reset"><RotateCcw aria-hidden="true" />Zerar</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        :class="big ? 'fixed inset-0 z-50 overflow-y-auto bg-background p-4 sm:p-8' : players.length > 0 && 'max-lg:order-first'"
        :role="big ? 'dialog' : undefined"
        :aria-modal="big ? 'true' : undefined"
        :aria-label="big ? 'Placar em tela cheia' : undefined"
      >
        <div :class="big ? 'mx-auto max-w-7xl space-y-6' : 'space-y-4'">
          <div class="flex min-h-11 items-center justify-between gap-3">
            <h2 :class="big ? 'text-2xl sm:text-3xl' : 'text-xl'">{{ target ? `Partida até ${target}` : 'Partida livre' }}</h2>
            <div class="flex gap-2">
              <Button v-if="big" type="button" variant="outline" size="icon" :disabled="history.length === 0" aria-label="Desfazer" @click="undo"><Undo2 aria-hidden="true" /></Button>
              <Button type="button" variant="outline" :size="big ? 'icon' : 'default'" :aria-label="big ? 'Sair do telão' : undefined" :disabled="players.length === 0" @click="toggleBig">
                <component :is="big ? Minimize : Maximize" aria-hidden="true" /><template v-if="!big">Telão</template>
              </Button>
            </div>
          </div>

          <div v-if="champion" :data-tool="champion.color" class="flex flex-col gap-4 rounded-xl border border-tool/40 bg-tool/10 p-4 sm:flex-row sm:items-center sm:p-5" aria-live="polite">
            <span class="flex size-14 shrink-0 items-center justify-center rounded-chip border border-tool/20 bg-tool text-tool-foreground"><Trophy class="size-7" aria-hidden="true" /></span>
            <div class="min-w-0 flex-1">
              <p class="font-display text-2xl font-semibold tracking-tight text-balance">{{ champion.name }} venceu!</p>
              <p class="text-muted-foreground tabular-nums">Fez {{ champion.score }} pontos com a meta em {{ target }}.</p>
            </div>
            <Button type="button" size="lg" class="bg-tool text-tool-foreground hover:bg-tool/90" @click="newGame"><Flag aria-hidden="true" />Nova partida</Button>
          </div>

          <EmptyState v-if="players.length === 0" :icon="Trophy" description="Adicione os jogadores para começar a marcar pontos." class="py-12" />
          <TransitionGroup v-else tag="ul" name="board" :class="['grid gap-4 sm:grid-cols-2', big && 'lg:grid-cols-3']">
            <li v-for="player in shown" :key="player.id" class="flex">
              <PlayerCard
                class="w-full"
                :player="player"
                :rank="positions.get(player.id) ?? 1"
                :leading="ahead.includes(player.id)"
                :behind="behindLeader(players, player.id)"
                :target="target"
                :step="step"
                :delta="deltas.get(player.id) ?? null"
                :big="big"
                @add="change(player.id, 1)"
                @subtract="change(player.id, -1)"
                @remove="removing = player"
              />
            </li>
          </TransitionGroup>
          <p class="sr-only" aria-live="polite">{{ ahead.length === 1 ? `${players.find((player) => player.id === ahead[0])?.name} está na frente.` : '' }}</p>
        </div>
      </div>
    </div>

    <ConfirmDelete
      v-model:open="removeOpen"
      :title="`Remover ${removing?.name ?? 'jogador'}?`"
      description="Os pontos e as vitórias saem do placar. Dá para voltar com Desfazer."
      confirm-label="Remover"
      @confirm="confirmRemove"
    />
  </section>
</template>

<style scoped>
/* Ao ordenar por pontos, os cartões deslizam para a nova posição. */
.board-move {
  transition: transform 450ms cubic-bezier(0.16, 1, 0.3, 1);
}
.board-enter-active {
  transition: opacity 250ms ease-out, transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}
.board-enter-from {
  opacity: 0;
  transform: translateY(0.5rem);
}
.board-leave-active {
  display: none;
}
@media (prefers-reduced-motion: reduce) {
  .board-move,
  .board-enter-active {
    transition: none;
  }
}
</style>
