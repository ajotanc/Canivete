<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { faceMatrix, faceToFrontMatrix, frameOf, polyhedron, shade, type PolyKind } from '../lib/polyhedra'

/**
 * Dado de faces planas em 3D (d4, d8, d10, d12 e d20), montado com a geometria de verdade: cada face é um desenho SVG
 * colocado no lugar dela. A cada jogada o dado dá voltas e para com a face sorteada de frente, com o número em pé.
 * `rollKey` muda a cada jogada; é ele que dispara o giro.
 */
const props = defineProps<{
  kind: PolyKind
  /** Número escrito em cada face, na ordem das faces. */
  labels: readonly string[]
  /** Índice da face que fica de frente. */
  face: number
  rollKey: number
  /** Verdadeiro se o dado já nasce no meio de uma jogada (a primeira, ou dados novos) e deve girar ao aparecer. */
  rolling: boolean
  /** Atraso do início do giro (ms), para os dados não saírem exatamente juntos. */
  delay?: number
  /** Distância do centro até o vértice mais longe, em px. */
  radius: number
}>()

const ROLL_MS = 900
/** Eixo do giro; só as voltas cheias dependem dele, o fim é sempre a face sorteada. */
const AXIS = '1, 0.8, 0.4'
const PAD = 3
/** Inclinação leve do dado parado: sem ela, de frente, só se vê uma face e o d4 vira um triângulo chapado. */
const TILT = 'rotateX(-18deg) rotateY(-24deg)'


const faces = computed(() =>
  polyhedron(props.kind).map((face, index) => {
    const frame = frameOf(face)
    const width = 2 * frame.halfWidth * props.radius
    const height = 2 * frame.halfHeight * props.radius
    const label = props.labels[index] ?? ''
    return {
      key: index,
      label,
      width: width + PAD * 2,
      height: height + PAD * 2,
      viewBox: `${-width / 2 - PAD} ${-height / 2 - PAD} ${width + PAD * 2} ${height + PAD * 2}`,
      points: frame.polygon.map(([x, y]) => `${(x * props.radius).toFixed(2)},${(y * props.radius).toFixed(2)}`).join(' '),
      matrix: faceMatrix(frame, props.radius),
      front: faceToFrontMatrix(frame),
      opacity: 0.14 + 0.3 * shade(frame.n),
      fontSize: Math.min(26, frame.inradius * props.radius * (label.length > 1 ? 1.05 : 1.35)),
    }
  }),
)

const target = computed(() => `${TILT} ${faces.value[Math.min(Math.max(props.face, 0), faces.value.length - 1)].front}`)
const body = ref<HTMLElement>()
/** Orientação em que o dado está parado, de onde o próximo giro parte. */
let resting = target.value

/** `transform` com as voltas entre a inclinação e a orientação; as duas pontas da animação têm a mesma lista de funções. */
function spun(orientation: string, degrees: number): string {
  const [tilt, matrix] = [orientation.slice(0, orientation.indexOf(' matrix3d')), orientation.slice(orientation.indexOf('matrix3d'))]
  return `${tilt} rotate3d(${AXIS}, ${degrees}deg) ${matrix}`
}

function play(): void {
  const to = target.value
  if (body.value) {
    body.value.animate(
      [{ transform: spun(resting, 0) }, { transform: spun(to, 1080) }],
      { duration: ROLL_MS, delay: props.delay ?? 0, fill: 'backwards', easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
    )
  }
  resting = to
}

watch(() => props.rollKey, play, { flush: 'post' })
onMounted(() => props.rolling && play())
</script>

<template>
  <div class="relative [perspective:700px]" :style="{ width: `${radius * 2}px`, height: `${radius * 2}px` }" role="img" :aria-label="`Dado ${kind}`">
    <div ref="body" class="relative size-full [transform-style:preserve-3d]" :style="{ transform: target }">
      <svg
        v-for="face in faces"
        :key="face.key"
        class="absolute overflow-visible [backface-visibility:hidden]"
        :viewBox="face.viewBox"
        :style="{ width: `${face.width}px`, height: `${face.height}px`, left: `calc(50% - ${face.width / 2}px)`, top: `calc(50% - ${face.height / 2}px)`, transform: face.matrix }"
        aria-hidden="true"
      >
        <polygon :points="face.points" class="fill-primary stroke-primary" :fill-opacity="face.opacity" stroke-width="1.8" stroke-linejoin="round" />
        <text x="0" y="0" text-anchor="middle" dominant-baseline="central" :font-size="face.fontSize" font-weight="700" class="fill-foreground tabular-nums">{{ face.label }}</text>
      </svg>
    </div>
  </div>
</template>
