<script setup lang="ts">
import { ref } from 'vue'
import { spinTo } from '../lib/shapes'
import type { CoinSide } from '../lib/roll'

/**
 * Moeda de 1 real em 3D: duas faces (cara com a efígie, coroa com o valor) e a borda feita de camadas, para ter espessura.
 * `toss` arremessa a moeda para cima, gira de ponta a ponta e pousa no lado sorteado; a promessa termina quando ela pousa.
 */
const TOSS_MS = 1500
const LIFT_PX = 150
/** Espessura da moeda em px: as faces ficam a metade para cada lado do centro. */
const THICKNESS = 10
const RIM_LAYERS = 9

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
</script>

<template>
  <div class="flex flex-col items-center [perspective:900px]">
    <div ref="lift" class="size-40">
      <div ref="coin" class="relative size-full [transform-style:preserve-3d]" :style="{ transform: `rotateX(${angle}deg)` }">
        <!-- Borda: discos empilhados entre as duas faces -->
        <span v-for="layer in RIM_LAYERS" :key="layer" class="absolute inset-0 rounded-full bg-[#b8892f]" :style="{ transform: `translateZ(${(layer - (RIM_LAYERS + 1) / 2) * (THICKNESS / RIM_LAYERS)}px)`, filter: `brightness(${0.78 + (layer % 3) * 0.08})` }" />

        <!-- Cara: efígie -->
        <svg viewBox="0 0 100 100" class="absolute inset-0 size-full [backface-visibility:hidden]" :style="{ transform: `translateZ(${THICKNESS / 2}px)` }" role="img" aria-label="Cara da moeda">
          <defs>
            <linearGradient id="coin-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#f6d77a" />
              <stop offset="0.5" stop-color="#d9a441" />
              <stop offset="1" stop-color="#a8761f" />
            </linearGradient>
            <linearGradient id="coin-silver" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#f4f5f7" />
              <stop offset="0.55" stop-color="#c3c8cf" />
              <stop offset="1" stop-color="#8f969f" />
            </linearGradient>
            <path id="coin-arc" d="M 11 50 A 39 39 0 0 1 89 50" />
          </defs>
          <circle cx="50" cy="50" r="49" fill="url(#coin-gold)" stroke="#8a5a12" stroke-width="1" />
          <circle cx="50" cy="50" r="46.5" fill="none" stroke="#8a5a12" stroke-width="1.2" stroke-dasharray="1.2 1.8" opacity="0.7" />
          <circle cx="50" cy="50" r="35" fill="url(#coin-silver)" stroke="#8a5a12" stroke-width="0.8" />
          <text font-size="7.5" font-weight="700" letter-spacing="1.5" fill="#6e4510" text-anchor="middle"><textPath href="#coin-arc" startOffset="50%">BRASIL</textPath></text>
          <!-- Efígie da República, de perfil -->
          <path d="M 56 27 C 64 28 68 35 67 42 C 66.5 45 68.5 47 68 50 C 67.5 53 66 54 66.5 56.5 C 67 59 64.5 61 61.5 60.5 L 61 66 L 68 69 L 64 74 L 40 74 C 36 66 33.5 55 36 45 C 38 35 46 26 56 27 Z" fill="url(#coin-gold)" stroke="#8a5a12" stroke-width="0.9" stroke-linejoin="round" />
          <path d="M 44 32 C 50 29 58 31 61 37" fill="none" stroke="#8a5a12" stroke-width="0.9" stroke-linecap="round" />
          <circle cx="60" cy="43" r="1.1" fill="#6e4510" />
        </svg>

        <!-- Coroa: valor -->
        <svg viewBox="0 0 100 100" class="absolute inset-0 size-full [backface-visibility:hidden]" :style="{ transform: `rotateX(180deg) translateZ(${THICKNESS / 2}px)` }" role="img" aria-label="Coroa da moeda">
          <circle cx="50" cy="50" r="49" fill="url(#coin-gold)" stroke="#8a5a12" stroke-width="1" />
          <circle cx="50" cy="50" r="46.5" fill="none" stroke="#8a5a12" stroke-width="1.2" stroke-dasharray="1.2 1.8" opacity="0.7" />
          <circle cx="50" cy="50" r="35" fill="url(#coin-silver)" stroke="#8a5a12" stroke-width="0.8" />
          <text x="50" y="62" font-size="42" font-weight="800" text-anchor="middle" fill="#6e4510">1</text>
          <text x="50" y="73" font-size="9" font-weight="700" letter-spacing="2" text-anchor="middle" fill="#6e4510">REAL</text>
          <g fill="#8a5a12">
            <circle cx="24" cy="50" r="1.4" />
            <circle cx="76" cy="50" r="1.4" />
            <circle cx="50" cy="22" r="1.4" />
          </g>
        </svg>
      </div>
    </div>
    <div ref="shadow" class="mt-5 h-3 w-28 rounded-full bg-foreground/20 blur-sm" aria-hidden="true" />
  </div>
</template>
