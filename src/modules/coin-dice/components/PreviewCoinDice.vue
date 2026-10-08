<script setup lang="ts">
import { Crown, Star } from '@lucide/vue'
import { CUBE_FACES, pipCells } from '../lib/shapes'

// Miniatura da moeda e do dado, com o mesmo desenho da ferramenta: a moeda de ouro vira da estrela para a coroa e o cubo
// gira, os dois ao passar o mouse (ou focar o card).

/** Metade da aresta do cubo da miniatura (3rem de aresta). */
const HALF = '1.5rem'
</script>

<template>
  <div class="flex w-44 items-center justify-around rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <!-- Moeda: estrela de um lado, coroa do outro -->
    <div class="size-14 [perspective:320px]">
      <div class="relative size-full transition-transform duration-[900ms] ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(540deg)] group-focus-visible:[transform:rotateY(540deg)] motion-reduce:transition-none">
        <div class="absolute inset-0 flex items-center justify-center rounded-full border border-[#8a5a12]/60 bg-[conic-gradient(from_30deg,#7d520f,#fbe48f_14%,#c58a2a_28%,#fff3bd_42%,#9a6a19_56%,#f3cf6a_70%,#b47b21_84%,#7d520f)] shadow-sm [backface-visibility:hidden]">
          <span class="flex size-[2.6rem] items-center justify-center rounded-full border border-[#fff0b0]/80 bg-[radial-gradient(circle_at_35%_30%,#f9e08d,#dcab43_60%,#b98427)]">
            <Star class="size-6 fill-[#fff0b0] text-[#7a4e0e]" stroke-width="1.5" />
          </span>
        </div>
        <div class="absolute inset-0 flex items-center justify-center rounded-full border border-[#8a5a12]/60 bg-[conic-gradient(from_210deg,#7d520f,#fbe48f_14%,#c58a2a_28%,#fff3bd_42%,#9a6a19_56%,#f3cf6a_70%,#b47b21_84%,#7d520f)] shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span class="flex size-[2.6rem] items-center justify-center rounded-full border border-[#fff0b0]/80 bg-[radial-gradient(circle_at_35%_30%,#f9e08d,#dcab43_60%,#b98427)]">
            <Crown class="size-6 fill-[#fff0b0] text-[#7a4e0e]" stroke-width="1.5" />
          </span>
        </div>
      </div>
    </div>

    <!-- Dado: cubo com pontos, visto de cantinho -->
    <div class="size-12 [perspective:260px]">
      <div class="relative size-full transition-transform duration-[900ms] ease-out [transform-style:preserve-3d] [transform:rotateX(-24deg)_rotateY(32deg)] group-hover:[transform:rotateX(-24deg)_rotateY(752deg)] group-focus-visible:[transform:rotateX(-24deg)_rotateY(752deg)] motion-reduce:transition-none">
        <div
          v-for="face in CUBE_FACES"
          :key="face.value"
          class="absolute inset-0 grid grid-cols-3 grid-rows-3 rounded-md border border-foreground/20 bg-card p-1.5 [backface-visibility:hidden]"
          :style="{ transform: `${face.place} translateZ(${HALF})` }"
        >
          <span v-for="cell in 9" :key="cell" class="m-auto size-1.5 rounded-full" :class="pipCells(face.value).includes(cell) ? 'bg-tool' : ''" />
        </div>
      </div>
    </div>
  </div>
</template>
