<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

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
  emit('done')
}

function start() {
  stop()
  revealed.value = false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish()
    return
  }
  // Math.random é suficiente aqui: os nomes embaralhados são só efeito visual.
  intervalId = setInterval(() => {
    displayed.value = props.winners.map(
      () => props.names[Math.floor(Math.random() * props.names.length)] ?? '',
    )
  }, 80)
  timeoutId = setTimeout(finish, props.durationMs ?? 2000)
}

watch(() => props.winners, start, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <ul class="space-y-2" aria-live="polite">
    <li
      v-for="(name, index) in displayed"
      :key="index"
      class="rounded-lg border px-4 py-3 text-center text-2xl font-bold transition-all duration-300"
      :class="revealed ? 'scale-105 border-primary bg-primary/10 text-primary' : 'animate-pulse text-muted-foreground'"
    >
      {{ name }}
    </li>
  </ul>
</template>
