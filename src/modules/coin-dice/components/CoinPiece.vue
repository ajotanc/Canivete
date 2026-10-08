<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CoinSide } from '../lib/roll'

/**
 * Moeda de ouro em 3D de verdade: o disco tem espessura (a borda é feita de camadas serrilhadas) e o desenho de cada face
 * (estrela radiante na cara, coroa real na coroa) é um relevo empilhado em três alturas, então ele se desloca ao girar.
 * `toss` arremessa a moeda para cima, faz ela girar em volta de um eixo inclinado, como os dados, e pousa no lado sorteado.
 * A promessa termina quando ela pousa.
 */
const TOSS_MS = 1500
const LIFT_PX = 100
/** Espessura da moeda em px: as faces ficam a metade para cada lado do centro. */
const THICKNESS = 12
const RIM_LAYERS = 11
/** Inclinação da moeda parada, para a borda aparecer e ela parecer um objeto, não uma figura. */
const TILT = 26
/** Eixo do giro no ar, inclinado para a moeda rolar de lado também, e não só virar de ponta a ponta. */
const AXIS = '1, 0.35, 0.15'
const TURNS = 5
/** Alturas do relevo acima da face (px) e o escurecimento de cada camada: a de baixo é a mais escura, a de cima a mais clara. */
const RELIEF = [
  { raise: 1, brightness: 0.6 },
  { raise: 2, brightness: 0.8 },
  { raise: 3, brightness: 1 },
] as const

const lift = ref<HTMLElement>()
const coin = ref<HTMLElement>()
const shadow = ref<HTMLElement>()
const glintHeads = ref<HTMLElement>()
const glintTails = ref<HTMLElement>()
/** Lado que está para cima agora. */
const resting = ref<CoinSide>('heads')

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const flipOf = (side: CoinSide): number => (side === 'heads' ? 0 : 180)
/** `transform` da moeda: inclinação, voltas em volta do eixo e a virada que escolhe o lado. As duas pontas da animação têm a mesma lista de funções. */
const orientation = (degrees: number, side: CoinSide): string => `rotateX(${TILT}deg) rotate3d(${AXIS}, ${degrees}deg) rotateX(${flipOf(side)}deg)`

async function toss(side: CoinSide): Promise<void> {
  const from = resting.value
  // O estado final já vale; a animação só cobre o caminho até ele.
  resting.value = side
  if (reducedMotion() || !coin.value || !lift.value || !shadow.value) return

  const duration = { duration: TOSS_MS }
  const animations = [
    coin.value.animate([{ transform: orientation(0, from) }, { transform: orientation(360 * TURNS, side) }], { ...duration, easing: 'cubic-bezier(0.3, 0.1, 0.3, 1)' }),
    lift.value.animate(
      [
        { transform: 'translateY(0) rotateZ(0deg)', easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
        { transform: `translateY(-${LIFT_PX}px) rotateZ(7deg)`, offset: 0.45, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
        { transform: 'translateY(0) rotateZ(0deg)' },
      ],
      duration,
    ),
    // Um brilho passa pelas duas faces enquanto a moeda gira.
    ...[glintHeads.value, glintTails.value].flatMap((glint) =>
      glint
        ? [glint.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.2, offset: 0.55 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], duration), glint.firstElementChild!.animate([{ transform: 'translateX(-60%) skewX(-12deg)' }, { transform: 'translateX(60%) skewX(-12deg)' }], { ...duration, easing: 'ease-in-out' })]
        : [],
    ),
    shadow.value.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.55)', opacity: 0.5, offset: 0.45 }, { transform: 'scale(1)', opacity: 1 }], duration),
  ]
  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)))
}

defineExpose({ toss })

interface Leaf {
  x: number
  y: number
  rotate: number
}

/** Folhas de louro em dois ramos que sobem pelos lados da moeda, do pé até perto do topo. */
const leaves = computed<Leaf[]>(() => {
  const result: Leaf[] = []
  for (let index = 0; index < 8; index++) {
    const angle = 108 + index * 17
    for (const side of [1, -1]) {
      const radians = ((side === 1 ? angle : 180 - angle) * Math.PI) / 180
      // As folhas alternam um pouco para dentro e para fora do ramo, apontando para cima.
      const outer = index % 2 === 0
      const radius = 32 + (outer ? 1.8 : -1.8)
      result.push({ x: 50 + radius * Math.cos(radians), y: 50 + radius * Math.sin(radians), rotate: (radians * 180) / Math.PI + 90 + (outer ? 28 : -28) * side })
    }
  }
  return result
})

/** Ramo (arco) por onde as folhas crescem, um de cada lado. */
const branches = ['M 50 83 A 33 33 0 0 1 20 36', 'M 50 83 A 33 33 0 0 0 80 36']

const point = (radius: number, degrees: number): [number, number] => [50 + radius * Math.cos((degrees * Math.PI) / 180), 50 + radius * Math.sin((degrees * Math.PI) / 180)]
const fixed = (value: number): string => value.toFixed(2)

/**
 * Estrela de oito pontas lapidada como uma joia: cada ponta se divide em duas facetas, uma clara e uma escura.
 * Cada faceta é um triângulo do centro até a ponta e o vale vizinho.
 */
const starFacets = Array.from({ length: 16 }, (_, index) => {
  const tip = Math.floor(index / 2)
  const light = index % 2 === 0
  const [tx, ty] = point(22, -90 + tip * 45)
  const [vx, vy] = point(8.6, -90 + tip * 45 + (light ? -22.5 : 22.5))
  return { points: `50,50 ${fixed(vx)},${fixed(vy)} ${fixed(tx)},${fixed(ty)}`, light }
})

/** Contas (pérolas) do aro da borda. */
const beads = Array.from({ length: 64 }, (_, index) => point(46, (index * 360) / 64))

/** Círculos concêntricos finos no campo, como o acabamento de máquina de uma moeda de verdade. */
const guilloche = Array.from({ length: 14 }, (_, index) => 6 + index * 2.6)

/** Raios finos em volta da estrela, alternando curtos e longos. */
const rays = Array.from({ length: 32 }, (_, index) => {
  const degrees = index * (360 / 32) + 5.6
  const [x1, y1] = point(25, degrees)
  const [x2, y2] = point(index % 2 === 0 ? 30.5 : 28, degrees)
  return { x1, y1, x2, y2 }
})
</script>

<template>
  <div class="flex flex-col items-center [perspective:1000px]">
    <!-- Gradientes, filtro e os desenhos em relevo, usados pelas duas faces -->
    <svg width="0" height="0" class="absolute" aria-hidden="true">
      <defs>
        <radialGradient id="coin-gold" cx="0.3" cy="0.25" r="1">
          <stop offset="0" stop-color="#fff6c8" />
          <stop offset="0.3" stop-color="#f4cf63" />
          <stop offset="0.65" stop-color="#cc922d" />
          <stop offset="1" stop-color="#7d520f" />
        </radialGradient>
        <radialGradient id="coin-field" cx="0.38" cy="0.3" r="0.85">
          <stop offset="0" stop-color="#f9e08d" />
          <stop offset="0.55" stop-color="#e0b04a" />
          <stop offset="1" stop-color="#b98427" />
        </radialGradient>
        <linearGradient id="coin-bead" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff3bd" />
          <stop offset="1" stop-color="#9a6a19" />
        </linearGradient>
        <linearGradient id="coin-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.6" />
          <stop offset="0.5" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <filter id="coin-relief" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="-0.5" dy="-0.5" stdDeviation="0.25" flood-color="#fff6c8" flood-opacity="0.9" />
          <feDropShadow dx="0.7" dy="0.9" stdDeviation="0.45" flood-color="#4a2f05" flood-opacity="0.75" />
        </filter>
        <path id="coin-text-top" d="M 12.5 50 A 37.5 37.5 0 0 1 87.5 50" />

        <!-- Louro: nas duas faces -->
        <g id="coin-laurel">
          <path v-for="branch in branches" :key="branch" :d="branch" fill="none" stroke="url(#coin-gold)" stroke-width="1.2" stroke-linecap="round" />
          <path v-for="(leaf, index) in leaves" :key="index" d="M 0 -5.4 C 3.1 -2.7 3.1 2.7 0 5.4 C -3.1 2.7 -3.1 -2.7 0 -5.4 Z" fill="url(#coin-gold)" stroke="#8a5a12" stroke-width="0.35" :transform="`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate}) scale(0.94)`" />
        </g>

        <!-- Cara: estrela lapidada com raios e louro -->
        <g id="coin-relief-heads">
          <use href="#coin-laurel" />
          <line v-for="(ray, index) in rays" :key="`ray-${index}`" :x1="ray.x1" :y1="ray.y1" :x2="ray.x2" :y2="ray.y2" stroke="url(#coin-gold)" stroke-width="1" stroke-linecap="round" />
          <circle cx="50" cy="50" r="23.5" fill="none" stroke="#8a5a12" stroke-width="0.7" />
          <polygon v-for="(facet, index) in starFacets" :key="index" :points="facet.points" :fill="facet.light ? '#fff0b0' : '#c9902f'" stroke="#7a4e0e" stroke-width="0.55" stroke-linejoin="round" />
          <circle cx="50" cy="50" r="2.6" fill="#fff6c8" stroke="#7a4e0e" stroke-width="0.6" />
        </g>

        <!-- Coroa: coroa real com arco, orbe, cruz e joias -->
        <g id="coin-relief-tails">
          <use href="#coin-laurel" />
          <g transform="translate(11 15) scale(0.78)">
            <path d="M 27 52 Q 36 24 50 25 Q 64 24 73 52" fill="none" stroke="url(#coin-gold)" stroke-width="3.2" stroke-linecap="round" />
            <path d="M 27 52 Q 36 24 50 25 Q 64 24 73 52" fill="none" stroke="#7a4e0e" stroke-width="0.5" stroke-linecap="round" />
            <path d="M 29 62 L 25 42 L 35.5 51 L 42 37 L 50 50 L 58 37 L 64.5 51 L 75 42 L 71 62 Z" fill="url(#coin-gold)" stroke="#7a4e0e" stroke-width="0.7" stroke-linejoin="round" />
            <rect x="29" y="62" width="42" height="9" rx="2.2" fill="url(#coin-gold)" stroke="#7a4e0e" stroke-width="0.7" />
            <circle cx="50" cy="22" r="3.4" fill="#fff0b0" stroke="#7a4e0e" stroke-width="0.7" />
            <path d="M 50 8.5 L 50 18 M 45.8 12.5 L 54.2 12.5" stroke="url(#coin-gold)" stroke-width="2.6" stroke-linecap="round" />
            <path d="M 50 8.5 L 50 18 M 45.8 12.5 L 54.2 12.5" stroke="#7a4e0e" stroke-width="0.4" stroke-linecap="round" />
            <g fill="#fff0b0" stroke="#7a4e0e" stroke-width="0.6">
              <circle cx="25" cy="40" r="2.6" />
              <circle cx="42" cy="35" r="2.4" />
              <circle cx="58" cy="35" r="2.4" />
              <circle cx="75" cy="40" r="2.6" />
            </g>
            <g stroke="#6e4510" stroke-width="0.55">
              <circle cx="35" cy="66.5" r="2" fill="#c0392b" />
              <circle cx="42.5" cy="66.5" r="1.6" fill="#fff6c8" />
              <circle cx="50" cy="66.5" r="2.2" fill="#2f6fd0" />
              <circle cx="57.5" cy="66.5" r="1.6" fill="#fff6c8" />
              <circle cx="65" cy="66.5" r="2" fill="#c0392b" />
            </g>
          </g>
        </g>

        <!-- Detalhes de cada face: aro de contas, campo com acabamento e texto, sem o relevo -->
        <g id="coin-plate">
          <circle cx="50" cy="50" r="42.5" fill="url(#coin-field)" stroke="#fff0b0" stroke-opacity="0.85" stroke-width="0.8" />
          <circle cx="50" cy="50" r="41.4" fill="none" stroke="#7a4e0e" stroke-opacity="0.6" stroke-width="0.7" />
          <circle v-for="radius in guilloche" :key="radius" cx="50" cy="50" :r="radius" fill="none" stroke="#7a4e0e" stroke-opacity="0.07" stroke-width="0.6" />
          <circle v-for="(bead, index) in beads" :key="index" :cx="bead[0]" :cy="bead[1]" r="1.15" fill="url(#coin-bead)" stroke="#6e4510" stroke-width="0.25" />
          <circle cx="50" cy="50" r="48.6" fill="none" stroke="#6e4510" stroke-opacity="0.7" stroke-width="0.6" />
          <path d="M 12 38 A 42 42 0 0 1 60 8" fill="none" stroke="url(#coin-shine)" stroke-width="3" stroke-linecap="round" />
        </g>
        <g id="coin-text-heads" font-family="inherit" font-weight="800" fill="#6e4510" stroke="#fff0b0" stroke-opacity="0.55" stroke-width="0.25" paint-order="stroke">
          <text font-size="4.3" letter-spacing="1.6" text-anchor="middle"><textPath href="#coin-text-top" startOffset="50%">CARA OU COROA</textPath></text>
        </g>
      </defs>
    </svg>

    <div ref="lift" class="size-44">
      <div ref="coin" class="relative size-full [transform-style:preserve-3d]" :style="{ transform: orientation(0, resting) }">
        <!-- Borda: discos serrilhados empilhados entre as duas faces -->
        <span
          v-for="layer in RIM_LAYERS"
          :key="layer"
          class="absolute inset-0 rounded-full bg-[repeating-conic-gradient(#e0ab41_0_2.5deg,#9a6a19_2.5deg_5deg)]"
          :style="{ transform: `translateZ(${(layer - (RIM_LAYERS + 1) / 2) * (THICKNESS / RIM_LAYERS)}px)` }"
        />

        <!-- Cara: disco metálico, detalhes, relevo em três alturas e brilho -->
        <div class="absolute inset-0 rounded-full [backface-visibility:hidden] [background:conic-gradient(from_30deg,#7d520f,#fbe48f_12%,#c58a2a_25%,#fff3bd_38%,#9a6a19_50%,#f3cf6a_62%,#b47b21_75%,#fff0b0_88%,#7d520f)]" :style="{ transform: `translateZ(${THICKNESS / 2}px)` }" />
        <svg viewBox="0 0 100 100" class="absolute inset-0 size-full [backface-visibility:hidden]" :style="{ transform: `translateZ(${THICKNESS / 2 + 0.3}px)` }" role="img" aria-label="Cara da moeda: estrela">
          <use href="#coin-plate" />
          <use href="#coin-text-heads" />
        </svg>
        <svg
          v-for="level in RELIEF"
          :key="`heads-${level.raise}`"
          viewBox="0 0 100 100"
          class="absolute inset-0 size-full [backface-visibility:hidden]"
          :style="{ transform: `translateZ(${THICKNESS / 2 + level.raise}px)`, filter: `brightness(${level.brightness})` }"
          aria-hidden="true"
        >
          <use href="#coin-relief-heads" :filter="level.brightness === 1 ? 'url(#coin-relief)' : undefined" />
        </svg>
        <div ref="glintHeads" class="pointer-events-none absolute inset-0 overflow-hidden rounded-full opacity-0 [backface-visibility:hidden]" :style="{ transform: `translateZ(${THICKNESS / 2 + 3.6}px)` }" aria-hidden="true">
          <div class="size-full -skew-x-12 bg-[linear-gradient(100deg,transparent_38%,rgb(255_255_255/0.75)_50%,transparent_62%)]" />
        </div>

        <!-- Coroa: o mesmo, do lado de trás -->
        <div class="absolute inset-0 rounded-full [backface-visibility:hidden] [background:conic-gradient(from_210deg,#7d520f,#fbe48f_12%,#c58a2a_25%,#fff3bd_38%,#9a6a19_50%,#f3cf6a_62%,#b47b21_75%,#fff0b0_88%,#7d520f)]" :style="{ transform: `rotateX(180deg) translateZ(${THICKNESS / 2}px)` }" />
        <svg viewBox="0 0 100 100" class="absolute inset-0 size-full [backface-visibility:hidden]" :style="{ transform: `rotateX(180deg) translateZ(${THICKNESS / 2 + 0.3}px)` }" role="img" aria-label="Coroa da moeda">
          <use href="#coin-plate" />
          <use href="#coin-text-heads" />
        </svg>
        <svg
          v-for="level in RELIEF"
          :key="`tails-${level.raise}`"
          viewBox="0 0 100 100"
          class="absolute inset-0 size-full [backface-visibility:hidden]"
          :style="{ transform: `rotateX(180deg) translateZ(${THICKNESS / 2 + level.raise}px)`, filter: `brightness(${level.brightness})` }"
          aria-hidden="true"
        >
          <use href="#coin-relief-tails" :filter="level.brightness === 1 ? 'url(#coin-relief)' : undefined" />
        </svg>
        <div ref="glintTails" class="pointer-events-none absolute inset-0 overflow-hidden rounded-full opacity-0 [backface-visibility:hidden]" :style="{ transform: `rotateX(180deg) translateZ(${THICKNESS / 2 + 3.6}px)` }" aria-hidden="true">
          <div class="size-full -skew-x-12 bg-[linear-gradient(100deg,transparent_38%,rgb(255_255_255/0.75)_50%,transparent_62%)]" />
        </div>
      </div>
    </div>
    <div ref="shadow" class="mt-5 h-3 w-32 rounded-full bg-foreground/20 blur-sm" aria-hidden="true" />
  </div>
</template>
