<script setup lang="ts">
import { ChevronsRight, Heart, LockKeyhole, Sparkles } from '@lucide/vue'
import { onBeforeUnmount, ref, useId, watch } from 'vue'

/** Carta selada: envelope e conteúdo ocupam a mesma área fixa, sem sobrepor o restante da página. */
const props = defineProps<{ name: string; revealed: boolean; names?: string[] }>()
const emit = defineEmits<{ landed: []; reveal: [] }>()

const uid = useId()
const opened = ref(props.revealed)
const progress = ref(0)
const dragging = ref(false)
const returning = ref(false)
let pointerId: number | null = null
let startX = 0
let travel = 180
const track = ref<HTMLElement | null>(null)
let landedTimer: ReturnType<typeof setTimeout> | undefined
let returningTimer: ReturnType<typeof setTimeout> | undefined

function open() {
  if (opened.value) return
  dragging.value = false
  progress.value = 1
  opened.value = true
  emit('reveal')
  clearTimeout(landedTimer)
  landedTimer = setTimeout(() => emit('landed'), 360)
}

function step() {
  progress.value = Math.min(1, progress.value + 0.34)
  if (progress.value >= 1) open()
}

function beginPull(event: PointerEvent) {
  if (opened.value) return
  pointerId = event.pointerId
  dragging.value = true
  travel = Math.max(1, (track.value?.clientWidth ?? 236) - 56)
  startX = event.clientX
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function pull(event: PointerEvent) {
  if (event.pointerId !== pointerId || opened.value) return
  progress.value = Math.min(1, Math.max(0, (event.clientX - startX) / travel))
  if (progress.value >= 1) open()
}

function releasePull(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  pointerId = null
  dragging.value = false
  if (!opened.value) progress.value = 0
}

watch(() => props.revealed, (isRevealed) => {
  if (!isRevealed) {
    clearTimeout(landedTimer)
    returning.value = true
    clearTimeout(returningTimer)
    returningTimer = setTimeout(() => (returning.value = false), 1000)
    opened.value = false
    progress.value = 0
    dragging.value = false
    pointerId = null
  }
})
onBeforeUnmount(() => {
  clearTimeout(landedTimer)
  clearTimeout(returningTimer)
})
</script>

<template>
  <div class="mx-auto w-full max-w-sm">
    <div class="relative h-74">
      <!-- Envelope: a aba levanta enquanto o lacre é arrastado e o envelope desce quando a carta sai -->
      <section
        class="absolute inset-0 overflow-hidden rounded-3xl bg-primary shadow-[0_22px_42px_-24px_color-mix(in_oklab,var(--primary),transparent_25%)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        :class="[opened ? 'pointer-events-none translate-y-8 scale-[0.94] opacity-0' : '', returning ? 'motion-safe:animate-[envelope-return_800ms_cubic-bezier(0.16,1,0.3,1)]' : '']"
        :aria-hidden="opened"
      >
        <div
          class="pointer-events-none absolute inset-x-0 top-0 h-36 origin-top bg-primary-foreground/10 backface-hidden [clip-path:polygon(0_0,100%_0,50%_100%)] motion-reduce:transition-none"
          :class="dragging ? '' : 'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]'"
          :style="{ transform: `perspective(700px) rotateX(${opened ? 180 : progress * 60}deg)` }"
          aria-hidden="true"
        />
        <div class="relative flex h-full flex-col items-center justify-between p-8 text-center text-primary-foreground">
          <div>
            <span class="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-foreground/15 ring-4 ring-primary-foreground/10">
              <LockKeyhole class="size-5" aria-hidden="true" />
            </span>
            <p class="mt-4 text-sm font-medium text-primary-foreground/80">Carta confidencial</p>
            <p class="mt-1 text-xl font-semibold leading-tight text-balance">Para abrir quando estiver pronto</p>
          </div>

          <div class="w-full">
            <div ref="track" class="relative h-14 rounded-full bg-primary-foreground/15 p-1.5">
              <div class="absolute inset-y-1.5 left-1.5 right-1.5 overflow-hidden rounded-full">
                <div class="h-full origin-left bg-primary-foreground/25" :style="{ transform: `scaleX(${progress})` }" />
              </div>
              <span
                class="pointer-events-none absolute inset-y-0 right-5 flex items-center text-primary-foreground/70 transition-opacity duration-200"
                :class="progress > 0.15 ? 'opacity-0' : ''"
                aria-hidden="true"
              >
                <ChevronsRight class="size-5 motion-safe:animate-pulse" />
              </span>
              <span
                v-if="returning"
                class="pointer-events-none absolute left-1.5 top-1.5 size-11 rounded-full bg-primary-foreground/60 motion-safe:animate-[seal-ripple_900ms_ease-out_300ms_both]"
                aria-hidden="true"
              />
              <button
                type="button"
                class="absolute top-1.5 flex size-11 touch-none items-center justify-center rounded-full bg-card text-primary shadow-md outline-none focus-visible:ring-3 focus-visible:ring-primary-foreground/70"
                :class="[dragging ? 'scale-105' : 'transition-[left,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]', returning ? 'motion-safe:animate-[seal-stamp_700ms_cubic-bezier(0.16,1,0.3,1)_200ms_both]' : progress === 0 && !opened ? 'motion-safe:animate-[seal-nudge_2.4s_ease-in-out_infinite]' : '']"
                :style="{ left: `calc(${progress} * (100% - 56px) + 6px)` }"
                aria-label="Arraste o lacre para abrir a carta"
                :aria-describedby="`${uid}-hint`"
                @pointerdown.prevent="beginPull"
                @pointermove.prevent="pull"
                @pointerup="releasePull"
                @pointercancel="releasePull"
                @keydown.right.prevent="step"
                @keydown.enter.prevent="open"
                @keydown.space.prevent="open"
              >
                <Heart class="size-5 fill-current" aria-hidden="true" />
              </button>
            </div>
            <p class="mt-3 text-xs font-medium text-primary-foreground/80">Arraste o lacre para abrir</p>
            <span :id="`${uid}-hint`" class="sr-only">Sem arrastar: pressione Enter ou Espaço para abrir, ou a seta para a direita para avançar aos poucos.</span>
          </div>
        </div>
      </section>

      <!-- Carta: sobe de dentro do envelope ao abrir e volta para dentro ao fechar -->
      <Transition name="letter">
        <article
          v-if="opened"
          class="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-foreground/10 bg-card px-7 text-center shadow-[0_22px_42px_-24px_rgb(14_20_32/0.42)]"
          aria-live="polite"
        >
          <Sparkles class="size-6 text-primary motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-700" aria-hidden="true" />
          <p class="mt-5 text-sm text-muted-foreground">Você vai presentear</p>
          <h2 class="mt-2 wrap-break-word text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">{{ name }}</h2>
          <div class="mt-7 h-px w-16 bg-primary/40" aria-hidden="true" />
          <p class="mt-4 text-sm text-muted-foreground">Guarde esse segredo até a hora da troca.</p>
        </article>
      </Transition>
    </div>
  </div>
</template>

<style>
.letter-enter-active {
  transition: opacity 400ms ease-out 120ms, transform 650ms cubic-bezier(0.16, 1, 0.3, 1) 120ms;
}

.letter-leave-active {
  transition: opacity 280ms ease-in, transform 380ms cubic-bezier(0.7, 0, 0.84, 0);
}

.letter-enter-from {
  opacity: 0;
  transform: translateY(70px) scale(0.9) rotate(-2deg);
}

.letter-leave-to {
  opacity: 0;
  transform: translateY(60px) scale(0.92) rotate(1.5deg);
}

@keyframes envelope-return {
  0% { transform: translateY(32px) scale(0.94); opacity: 0; }
  60% { transform: translateY(-4px) scale(1.015); opacity: 1; }
  100% { transform: translateY(0) scale(1); }
}

@keyframes seal-stamp {
  0% { transform: scale(1.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes seal-ripple {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(2.6); opacity: 0; }
}

@keyframes seal-nudge {
  0%, 60%, 100% { transform: translateX(0); }
  75% { transform: translateX(10px); }
  88% { transform: translateX(2px); }
}

@media (prefers-reduced-motion: reduce) {
  .letter-enter-active,
  .letter-leave-active { transition: none; }
}
</style>
