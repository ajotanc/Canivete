<script setup lang="ts">
import { computed, ref } from 'vue'
import { spinTo } from '../lib/shapes'
import type { CoinSide } from '../lib/roll'

/**
 * Moeda de ouro em 3D: duas faces em relevo (cara com um perfil, coroa com uma coroa real), borda serrilhada e espessura de verdade.
 * `toss` arremessa a moeda para cima, gira de ponta a ponta e pousa no lado sorteado; a promessa termina quando ela pousa.
 */
const TOSS_MS = 1500
const LIFT_PX = 160
/** Espessura da moeda em px: as faces ficam a metade para cada lado do centro. */
const THICKNESS = 12
const RIM_LAYERS = 11

const lift = ref<HTMLElement>()
const coin = ref<HTMLElement>()
const shadow = ref<HTMLElement>()
/** Giro acumulado em torno do eixo horizontal: múltiplos de 360 mostram a cara, 180 a mais mostram a coroa. */
const angle = ref(0)

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

async function toss(side: CoinSide): Promise<void> {
  const from = angle.value
  const to = spinTo(from, side === 'heads' ? 0 : 180, 5)
  // O estado final já vale; a animação só cobre o caminho até ele.
  angle.value = to
  if (reducedMotion() || !coin.value || !lift.value || !shadow.value) return

  const duration = { duration: TOSS_MS }
  const animations = [
    coin.value.animate([{ transform: `rotateX(${from}deg)` }, { transform: `rotateX(${to}deg)` }], { ...duration, easing: 'cubic-bezier(0.3, 0.1, 0.3, 1)' }),
    lift.value.animate(
      [
        { transform: 'translateY(0)', easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
        { transform: `translateY(-${LIFT_PX}px)`, offset: 0.45, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
        { transform: 'translateY(0)' },
      ],
      duration,
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
  for (let index = 0; index < 9; index++) {
    const angle = 104 + index * 15.5
    for (const side of [1, -1]) {
      const radians = ((side === 1 ? angle : 180 - angle) * Math.PI) / 180
      const radius = 31.5 + (index % 2 === 0 ? 0 : 1.6)
      result.push({ x: 50 + radius * Math.cos(radians), y: 50 + radius * Math.sin(radians), rotate: (radians * 180) / Math.PI + 90 + (index % 2 === 0 ? -22 : 22) * side })
    }
  }
  return result
})
</script>

<template>
  <div class="flex flex-col items-center [perspective:1000px]">
    <!-- Gradientes e filtros usados pelas duas faces -->
    <svg width="0" height="0" class="absolute" aria-hidden="true">
      <defs>
        <radialGradient id="coin-gold" cx="0.3" cy="0.25" r="1">
          <stop offset="0" stop-color="#fff3bd" />
          <stop offset="0.35" stop-color="#f1c453" />
          <stop offset="0.7" stop-color="#c88f2b" />
          <stop offset="1" stop-color="#8a5a12" />
        </radialGradient>
        <linearGradient id="coin-field" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e9b94a" />
          <stop offset="0.5" stop-color="#d09a32" />
          <stop offset="1" stop-color="#b17a1f" />
        </linearGradient>
        <linearGradient id="coin-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.55" />
          <stop offset="0.5" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <filter id="coin-relief" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="-0.5" dy="-0.5" stdDeviation="0.25" flood-color="#fff6c8" flood-opacity="0.9" />
          <feDropShadow dx="0.7" dy="0.9" stdDeviation="0.45" flood-color="#4a2f05" flood-opacity="0.75" />
        </filter>
      </defs>
    </svg>

    <div ref="lift" class="size-44">
      <div ref="coin" class="relative size-full [transform-style:preserve-3d]" :style="{ transform: `rotateX(${angle}deg)` }">
        <!-- Borda: discos serrilhados empilhados entre as duas faces -->
        <span
          v-for="layer in RIM_LAYERS"
          :key="layer"
          class="absolute inset-0 rounded-full bg-[repeating-conic-gradient(#e0ab41_0_2.5deg,#9a6a19_2.5deg_5deg)]"
          :style="{ transform: `translateZ(${(layer - (RIM_LAYERS + 1) / 2) * (THICKNESS / RIM_LAYERS)}px)` }"
        />

        <!-- Cara: perfil em relevo com ramos de louro -->
        <svg viewBox="0 0 100 100" class="absolute inset-0 size-full [backface-visibility:hidden]" :style="{ transform: `translateZ(${THICKNESS / 2}px)` }" role="img" aria-label="Cara da moeda">
          <circle cx="50" cy="50" r="49.5" fill="url(#coin-gold)" />
          <circle cx="50" cy="50" r="47" fill="none" stroke="#7a4e0e" stroke-width="1.6" stroke-dasharray="0.9 1.5" opacity="0.65" />
          <circle cx="50" cy="50" r="42.5" fill="url(#coin-field)" stroke="#fff0b0" stroke-opacity="0.8" stroke-width="0.8" />
          <circle cx="50" cy="50" r="41.5" fill="none" stroke="#7a4e0e" stroke-opacity="0.55" stroke-width="0.8" />
          <g filter="url(#coin-relief)">
            <ellipse v-for="(leaf, index) in leaves" :key="index" rx="2.1" ry="4.9" fill="url(#coin-gold)" :transform="`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate})`" />
            <!-- Perfil -->
            <path
              d="M 42 31 C 48 25 60 26 64 34 C 66 38 66 41 67 44 L 71.5 50 C 72.5 52 70.5 53 68.5 53 C 69 55 68.5 56 67 57 C 68.5 58 68 60 66 60.5 C 67 63 65 65 62 65.5 L 61.5 69 L 63 77 L 36 77 C 33 67 33 55 34.5 47 C 34.5 39 37 34 42 31 Z"
              fill="url(#coin-gold)"
            />
            <path d="M 42 33 C 47 29 56 29 61 34" fill="none" stroke="#8a5a12" stroke-width="1" stroke-linecap="round" />
            <path d="M 38 40 C 43 36 50 36 55 39 M 37 46 C 42 42 49 42 54 45" fill="none" stroke="#8a5a12" stroke-opacity="0.7" stroke-width="0.9" stroke-linecap="round" />
            <circle cx="61" cy="44" r="1.2" fill="#6e4510" />
            <path d="M 36 77 C 40 74 56 74 63 77" fill="none" stroke="#8a5a12" stroke-width="0.9" />
          </g>
          <path d="M 12 38 A 42 42 0 0 1 60 8" fill="none" stroke="url(#coin-shine)" stroke-width="3" stroke-linecap="round" />
        </svg>

        <!-- Coroa: coroa real com joias -->
        <svg viewBox="0 0 100 100" class="absolute inset-0 size-full [backface-visibility:hidden]" :style="{ transform: `rotateX(180deg) translateZ(${THICKNESS / 2}px)` }" role="img" aria-label="Coroa da moeda">
          <circle cx="50" cy="50" r="49.5" fill="url(#coin-gold)" />
          <circle cx="50" cy="50" r="47" fill="none" stroke="#7a4e0e" stroke-width="1.6" stroke-dasharray="0.9 1.5" opacity="0.65" />
          <circle cx="50" cy="50" r="42.5" fill="url(#coin-field)" stroke="#fff0b0" stroke-opacity="0.8" stroke-width="0.8" />
          <circle cx="50" cy="50" r="41.5" fill="none" stroke="#7a4e0e" stroke-opacity="0.55" stroke-width="0.8" />
          <g filter="url(#coin-relief)">
            <ellipse v-for="(leaf, index) in leaves" :key="index" rx="2.1" ry="4.9" fill="url(#coin-gold)" :transform="`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate})`" />
            <!-- Coroa -->
            <path d="M 31 63 L 26.5 40 L 38.5 51 L 50 34 L 61.5 51 L 73.5 40 L 69 63 Z" fill="url(#coin-gold)" />
            <rect x="31" y="63" width="38" height="8" rx="2" fill="url(#coin-gold)" />
            <path d="M 31 63 L 69 63" stroke="#8a5a12" stroke-width="0.9" />
            <g fill="#fff3bd" stroke="#8a5a12" stroke-width="0.7">
              <circle cx="26.5" cy="38.5" r="2.7" />
              <circle cx="50" cy="32" r="3.1" />
              <circle cx="73.5" cy="38.5" r="2.7" />
            </g>
            <g fill="#c0392b" stroke="#6e4510" stroke-width="0.6">
              <circle cx="38.5" cy="67" r="1.7" />
              <circle cx="61.5" cy="67" r="1.7" />
            </g>
            <circle cx="50" cy="67" r="2" fill="#2f6fd0" stroke="#6e4510" stroke-width="0.6" />
          </g>
          <path d="M 12 38 A 42 42 0 0 1 60 8" fill="none" stroke="url(#coin-shine)" stroke-width="3" stroke-linecap="round" />
        </svg>
      </div>
    </div>
    <div ref="shadow" class="mt-5 h-3 w-32 rounded-full bg-foreground/20 blur-sm" aria-hidden="true" />
  </div>
</template>
