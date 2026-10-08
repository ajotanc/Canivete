<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CUBE_FACES, cubeOrientation, pipCells, spinTo } from '../lib/shapes'
import type { PolyKind } from '../lib/polyhedra'
import { DICE_ROLL_MS, DICE_TABLE_HITS } from '../lib/roll'
import DicePolyhedron from './DicePolyhedron.vue'

/**
 * Um dado na tela, sempre em 3D. O d6 é um cubo com pontos; os outros são poliedros de faces planas (d4, d8, d10, d12, d20).
 * O d100 é um par de d10, como o dado de porcentagem de verdade: dezenas (00 a 90) e unidades (0 a 9).
 * Ao rolar, o dado pula e gira até a face sorteada ficar de frente. `rollKey` muda a cada jogada.
 */
const props = defineProps<{ sides: number; value: number; rollKey: number; rolling: boolean }>()

const ROLL_MS = DICE_ROLL_MS
/** Metade da aresta do cubo (px): as faces ficam a essa distância do centro. */
const HALF = 50
const RADIUS = 62
const RADIUS_PAIR = 50

const isCube = computed(() => props.sides === 6)
const isPair = computed(() => props.sides === 100)
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const lift = ref<HTMLElement>()
const body = ref<HTMLElement>()

// Cubo: giro acumulado em cada eixo.
const rotation = ref(cubeOrientation(props.value))

/**
 * O dado sobe, cai e bate na mesa (em 62% do tempo, ~560 ms), quica de novo e bate outra vez (92%, ~830 ms).
 * O som de `dice` tem as batidas nesses mesmos instantes.
 */
function hop(): void {
  if (!lift.value || reducedMotion()) return
  const up = 'cubic-bezier(0.2, 0.7, 0.4, 1)'
  const down = 'cubic-bezier(0.6, 0, 0.8, 0.4)'
  lift.value.animate(
    [
      { transform: 'translateY(0)', easing: up },
      { transform: 'translateY(-32px)', offset: 0.34, easing: down },
      { transform: 'translateY(0)', offset: DICE_TABLE_HITS[0], easing: up },
      { transform: 'translateY(-9px)', offset: (DICE_TABLE_HITS[0] + DICE_TABLE_HITS[1]) / 2, easing: down },
      { transform: 'translateY(0)', offset: DICE_TABLE_HITS[1] },
      { transform: 'translateY(0)' },
    ],
    { duration: ROLL_MS },
  )
}

/** Gira o cubo de `from` até a orientação da face sorteada. Sem `from`, parte do giro em que está. */
function spinCube(from?: { x: number; y: number }): void {
  const base = cubeOrientation(props.value)
  const start = from ?? rotation.value
  const to = { x: spinTo(start.x, base.x), y: spinTo(start.y, base.y) }
  rotation.value = to
  if (!reducedMotion() && body.value) {
    body.value.animate([{ transform: `rotateX(${start.x}deg) rotateY(${start.y}deg)` }, { transform: `rotateX(${to.x}deg) rotateY(${to.y}deg)` }], { duration: ROLL_MS, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' })
  }
}

// Dados que já estavam na tela giram quando a jogada muda; os poliedros cuidam do próprio giro.
watch(
  () => props.rollKey,
  () => {
    if (isCube.value) spinCube()
    hop()
  },
  { flush: 'post' },
)

// Dados que aparecem junto com a jogada (a primeira, ou quando a quantidade cresce) não têm mudança para observar: giram ao montar.
onMounted(() => {
  if (!props.rolling) return
  if (isCube.value) spinCube({ x: rotation.value.x - 720, y: rotation.value.y - 720 })
  hop()
})

const range = (length: number, label: (index: number) => string) => Array.from({ length }, (_, index) => label(index))
const LABELS: Record<PolyKind, string[]> = {
  d4: range(4, (index) => String(index + 1)),
  d8: range(8, (index) => String(index + 1)),
  d10: range(10, (index) => String(index + 1)),
  d12: range(12, (index) => String(index + 1)),
  d20: range(20, (index) => String(index + 1)),
}
const TENS = range(10, (index) => String(index * 10).padStart(2, '0'))
const ONES = range(10, (index) => String(index))

const kind = computed<PolyKind>(() => (isPair.value ? 'd10' : (`d${props.sides}` as PolyKind)))
/** Face de cada dado: o d100 usa dezenas e unidades (100 é 00 e 0). */
const faceIndex = computed(() => props.value - 1)
const tensIndex = computed(() => Math.floor((props.value % 100) / 10))
const onesIndex = computed(() => props.value % 10)
const label = computed(() => (isPair.value ? 'd%' : `d${props.sides}`))
</script>

<template>
  <div ref="lift" :class="isCube ? 'size-[6.25rem] [perspective:800px]' : ''" role="img" :aria-label="`Dado ${label}: ${value}`">
    <!-- d6: cubo -->
    <div v-if="isCube" ref="body" class="relative size-full [transform-style:preserve-3d]" :style="{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }">
      <div
        v-for="face in CUBE_FACES"
        :key="face.value"
        class="absolute inset-0 grid grid-cols-3 grid-rows-3 rounded-xl border border-foreground/15 bg-card p-3.5 shadow-inner [backface-visibility:hidden]"
        :style="{ transform: `${face.place} translateZ(${HALF}px)` }"
      >
        <span v-for="cell in 9" :key="cell" class="m-auto size-4 rounded-full" :class="pipCells(face.value).includes(cell) ? 'bg-foreground' : ''" />
      </div>
    </div>

    <!-- d100: dois d10, dezenas e unidades -->
    <div v-else-if="isPair" class="flex items-end gap-2">
      <DicePolyhedron kind="d10" :labels="TENS" :face="tensIndex" :roll-key="rollKey" :rolling="rolling" :radius="RADIUS_PAIR" />
      <DicePolyhedron kind="d10" :labels="ONES" :face="onesIndex" :roll-key="rollKey" :rolling="rolling" :radius="RADIUS_PAIR" />
    </div>

    <!-- d4, d8, d10, d12, d20 -->
    <DicePolyhedron v-else :kind="kind" :labels="LABELS[kind]" :face="faceIndex" :roll-key="rollKey" :rolling="rolling" :radius="RADIUS" />
  </div>
</template>
