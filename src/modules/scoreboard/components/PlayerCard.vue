<script setup lang="ts">
import { Crown, Minus, Plus, Trash2, Trophy } from '@lucide/vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Player } from '../lib/scoreboard'

/**
 * Cartão de um jogador no placar: posição, nome, pontos grandes e os botões de tirar e dar pontos.
 * A cor do jogador vem do `data-tool` do cartão (`bg-tool`, `text-tool`), sem mexer no primário da página.
 */
const props = defineProps<{
  player: Player
  rank: number
  /** Está na frente (sozinho ou empatado no topo). */
  leading: boolean
  /** Pontos que faltam para alcançar quem lidera. */
  behind: number
  target: number | null
  step: number
  /** Pontos somados nos últimos toques, para o "+5" que sobe ao lado do placar. */
  delta: { value: number; key: number } | null
  /** Modo telão: tudo maior, sem o botão de remover. */
  big?: boolean
}>()
const emit = defineEmits<{ add: []; subtract: []; remove: [] }>()

const progress = computed(() => (props.target ? Math.min(Math.max(props.player.score / props.target, 0), 1) : 0))
const missing = computed(() => (props.target ? Math.max(props.target - props.player.score, 0) : 0))

const status = computed(() => {
  if (props.leading) return 'Na frente'
  if (props.behind > 0) return `A ${props.behind} do líder`
  return props.player.score === 0 ? 'Sem pontos ainda' : 'Empate no topo'
})
const wins = computed(() => (props.player.wins === 1 ? '1 vitória' : `${props.player.wins} vitórias`))
const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`)
</script>

<template>
  <article
    :data-tool="player.color"
    :class="cn('relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors duration-300 motion-reduce:transition-none', leading && 'border-tool/60 bg-tool/5')"
    :aria-label="`${player.name}, ${rank}º lugar, ${player.score} pontos`"
  >
    <div class="h-1.5 bg-tool" aria-hidden="true" />

    <div :class="cn('flex flex-1 flex-col gap-4 p-4', big && 'gap-6 p-6')">
      <header class="flex items-center gap-3">
        <span
          :class="cn('flex size-11 shrink-0 items-center justify-center rounded-chip border border-tool/20 bg-tool/10 font-display text-lg font-semibold text-tool tabular-nums', leading && 'border-tool bg-tool text-tool-foreground', big && 'size-14 text-2xl')"
          :aria-label="`${rank}º lugar`"
        >
          <Crown v-if="leading" :class="big ? 'size-7' : 'size-5'" aria-hidden="true" />
          <template v-else>{{ rank }}º</template>
        </span>
        <div class="min-w-0 flex-1">
          <p :class="cn('truncate font-display text-lg font-semibold leading-tight', big && 'text-2xl')">{{ player.name }}</p>
          <p class="flex items-center gap-1.5 truncate text-sm text-muted-foreground tabular-nums">
            <span :class="leading && 'font-medium text-tool'">{{ status }}</span>
            <template v-if="player.wins > 0">
              <span aria-hidden="true">·</span>
              <span class="inline-flex items-center gap-1"><Trophy class="size-3.5" aria-hidden="true" />{{ wins }}</span>
            </template>
          </p>
        </div>
        <Button v-if="!big" variant="ghost" size="icon" class="-mr-2 text-muted-foreground" :aria-label="`Remover ${player.name}`" @click="emit('remove')"><Trash2 aria-hidden="true" /></Button>
      </header>

      <div class="relative flex items-center justify-center py-1">
        <Transition name="score" mode="out-in">
          <span
            :key="player.score"
            :class="cn('font-display text-6xl leading-none font-semibold tracking-tight tabular-nums sm:text-7xl', leading && 'text-tool', big && 'text-8xl sm:text-9xl')"
            aria-hidden="true"
          >{{ player.score }}</span>
        </Transition>
        <span v-if="delta" :key="delta.key" :class="cn('score-delta pointer-events-none absolute top-0 right-2 rounded-md border border-tool/20 bg-tool/10 px-2 py-0.5 text-sm font-semibold text-tool tabular-nums', big && 'text-lg')" aria-hidden="true">{{ signed(delta.value) }}</span>
      </div>

      <div v-if="target" class="space-y-1.5">
        <div class="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" :aria-valuenow="Math.max(player.score, 0)" :aria-valuemax="target" :aria-label="`${player.name} até a meta`">
          <div class="h-full rounded-full bg-tool transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none" :style="{ width: `${progress * 100}%` }" />
        </div>
        <p class="text-xs text-muted-foreground tabular-nums">{{ missing === 0 ? 'Chegou à meta' : `Faltam ${missing} para ${target}` }}</p>
      </div>

      <div class="mt-auto grid grid-cols-[auto_1fr] gap-2">
        <Button variant="outline" size="icon" :class="big && 'size-14'" :aria-label="`Tirar ${step} de ${player.name}`" @click="emit('subtract')"><Minus aria-hidden="true" /></Button>
        <Button
          :class="cn('bg-tool text-tool-foreground hover:bg-tool/90 tabular-nums', big && 'h-14 text-lg')"
          :aria-label="`Dar ${step} a ${player.name}`"
          @click="emit('add')"
        ><Plus aria-hidden="true" />{{ step }}</Button>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* O número novo entra subindo de leve; o "+5" sobe e some. Com movimento reduzido, só troca. */
.score-enter-active {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.score-leave-active {
  transition: opacity 90ms ease-out;
}
.score-enter-from {
  opacity: 0;
  transform: translateY(0.35em) scale(0.92);
}
.score-leave-to {
  opacity: 0;
}
.score-delta {
  animation: score-delta 1200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes score-delta {
  0% {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  15% {
    opacity: 1;
    transform: translateY(0);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-0.75rem);
  }
}
@media (prefers-reduced-motion: reduce) {
  .score-enter-active,
  .score-leave-active {
    transition: none;
  }
  .score-delta {
    animation: none;
  }
}
</style>
