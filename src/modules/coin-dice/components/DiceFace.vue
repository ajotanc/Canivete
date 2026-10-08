<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CUBE_FACES, cubeOrientation, dieShape, pipCells, spinTo, toPoints } from '../lib/shapes'

/**
 * Um dado na tela. O d6 é um cubo de verdade, com pontos, que gira até a face sorteada ficar de frente.
 * Os outros (d4, d8, d10, d12, d20 e d100) são desenhados como poliedros e giram no lugar, mostrando números aleatórios até parar.
 * `rollKey` muda a cada jogada; é ele que dispara a animação.
 */
const props = defineProps<{ sides: number; value: number; rollKey: number; rolling: boolean }>()

const ROLL_MS = 900
/** Metade da aresta do cubo (px): as faces ficam a essa distância do centro. */
const HALF = 32

const isCube = computed(() => props.sides === 6)
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const lift = ref<HTMLElement>()
const body = ref<HTMLElement>()

// Cubo: giro acumulado em cada eixo.
const rotation = ref(cubeOrientation(props.value))

/** O dado dá um pulinho ao ser jogado. */
function hop(): void {
  if (!lift.value || reducedMotion()) return
  lift.value.animate(
    [{ transform: 'translateY(0)', easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' }, { transform: 'translateY(-28px)', offset: 0.4, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' }, { transform: 'translateY(0)' }],
    { duration: ROLL_MS },
  )
}

watch(
  () => props.rollKey,
  () => {
    if (isCube.value) {
      const base = cubeOrientation(props.value)
      const from = rotation.value
      const to = { x: spinTo(from.x, base.x), y: spinTo(from.y, base.y) }
      rotation.value = to
      if (!reducedMotion() && body.value) {
        body.value.animate([{ transform: `rotateX(${from.x}deg) rotateY(${from.y}deg)` }, { transform: `rotateX(${to.x}deg) rotateY(${to.y}deg)` }], { duration: ROLL_MS, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' })
      }
    } else if (!reducedMotion() && body.value) {
      body.value.animate([{ transform: 'rotate(0deg) scale(1)' }, { transform: 'rotate(380deg) scale(1.15)', offset: 0.5 }, { transform: 'rotate(720deg) scale(1)' }], { duration: ROLL_MS, easing: 'ease-in-out' })
    }
    hop()
  },
  { flush: 'post' },
)

// Poliedros: números aleatórios enquanto rola.
const shown = ref(props.value)
let timer: ReturnType<typeof setInterval> | undefined
watch(
  () => props.rolling,
  (rolling) => {
    clearInterval(timer)
    if (rolling && !isCube.value) timer = setInterval(() => (shown.value = 1 + Math.floor(Math.random() * props.sides)), 70)
    else shown.value = props.value
  },
  { immediate: true },
)
watch(() => props.value, (value) => !props.rolling && (shown.value = value))
onBeforeUnmount(() => clearInterval(timer))

const shape = computed(() => dieShape(props.sides))
const label = computed(() => (props.sides === 100 ? 'd%' : `d${props.sides}`))
</script>

<template>
  <div ref="lift" class="size-16 [perspective:500px]" role="img" :aria-label="`Dado ${label}: ${value}`">
    <!-- d6: cubo -->
    <div v-if="isCube" ref="body" class="relative size-full [transform-style:preserve-3d]" :style="{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }">
      <div
        v-for="face in CUBE_FACES"
        :key="face.value"
        class="absolute inset-0 grid grid-cols-3 grid-rows-3 rounded-xl border bg-card p-2 shadow-inner"
        :style="{ transform: `${face.place} translateZ(${HALF}px)` }"
      >
        <span v-for="cell in 9" :key="cell" class="m-auto size-2.5 rounded-full" :class="pipCells(face.value).includes(cell) ? 'bg-foreground' : ''" />
      </div>
    </div>

    <!-- Outros dados: poliedro desenhado -->
    <div v-else ref="body" class="relative size-full">
      <svg viewBox="0 0 100 100" class="size-full overflow-visible drop-shadow-sm" aria-hidden="true">
        <polygon :points="toPoints(shape.outline)" class="fill-primary/15 stroke-primary" stroke-width="3" stroke-linejoin="round" />
        <line v-for="(edge, index) in shape.edges" :key="index" :x1="edge[0]" :y1="edge[1]" :x2="edge[2]" :y2="edge[3]" class="stroke-primary/50" stroke-width="1.5" stroke-linecap="round" />
        <text x="50" y="58" text-anchor="middle" :font-size="shown >= 100 ? 24 : shown >= 10 ? 30 : 36" font-weight="700" class="fill-foreground tabular-nums">{{ shown }}</text>
      </svg>
    </div>
  </div>
</template>
