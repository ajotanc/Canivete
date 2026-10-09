<script setup lang="ts">
import { Trophy } from '@lucide/vue'
import { onBeforeUnmount, ref, watch } from 'vue'
import { play } from '@/core/effects/sound'
import { DRAW_ANIMATION } from '../constants'

const props = defineProps<{ names: string[]; winners: string[]; durationMs?: number }>()
const emit = defineEmits<{ done: [] }>()

const displayed = ref<string[]>([])
const revealed = ref(false)
let intervalId: ReturnType<typeof setInterval> | undefined
let timeoutId: ReturnType<typeof setTimeout> | undefined

function stop() {
  clearInterval(intervalId)
  clearTimeout(timeoutId)
}

/** Mostra o resultado final e avisa quem escutou. O resultado já estava definido antes da animação. */
function finish() {
  stop()
  displayed.value = [...props.winners]
  revealed.value = true
  play('win')
  emit('done')
}

function start() {
  stop()
  revealed.value = false
  // Math.random é suficiente aqui: os nomes embaralhados são só efeito visual.
  intervalId = setInterval(() => {
    play('tick')
    displayed.value = props.winners.map(
      () => props.names[Math.floor(Math.random() * props.names.length)] ?? '',
    )
  }, DRAW_ANIMATION.shuffleIntervalMs)
  timeoutId = setTimeout(finish, props.durationMs ?? DRAW_ANIMATION.durationMs)
}

watch(() => props.winners, start, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <ol
    class="overflow-hidden rounded-2xl border border-primary/20 bg-primary p-2 shadow-[0_16px_32px_-20px_color-mix(in_oklab,var(--primary),transparent_20%)]"
    aria-live="polite"
    aria-label="Resultado do sorteio"
  >
    <li
      v-for="(name, index) in displayed"
      :key="index"
      class="relative overflow-hidden rounded-xl border px-4 py-4 transition-colors duration-300 motion-reduce:transition-none"
      :class="revealed ? 'border-transparent bg-card text-card-foreground shadow-sm animate-in zoom-in-95 fade-in duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none' : 'border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground'"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-chip"
          :class="revealed ? 'bg-primary/10 text-primary' : 'bg-primary-foreground/15 text-primary-foreground'"
        >
          <Trophy v-if="revealed" class="size-5" aria-hidden="true" />
          <span v-else class="text-sm font-semibold tabular-nums">{{ index + 1 }}</span>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-[0.14em]" :class="revealed ? 'text-muted-foreground' : 'text-primary-foreground/75'">
            {{ winners.length === 1 ? (revealed ? 'Nome sorteado' : 'Sorteando') : (revealed ? `${index + 1}º sorteado` : 'Sorteando') }}
          </p>
          <p class="truncate text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{{ name }}</p>
        </div>
      </div>
    </li>
  </ol>
</template>
