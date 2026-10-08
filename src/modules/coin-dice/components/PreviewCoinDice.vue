<script setup lang="ts">
import { Crown, Star } from '@lucide/vue'
import { pipCells } from '../lib/shapes'

// Miniatura da moeda e do dado no padrão dos cards da home: um mini-cartão com a moeda e o dado na cor da ferramenta,
// o resultado em texto e o botão. Ao passar o mouse (ou focar o card), a moeda vira da estrela para a coroa,
// o dado troca de 3 para 5 pontos e o resultado muda.

const BEFORE = 3
const AFTER = 5
const cells = Array.from({ length: 9 }, (_, index) => ({
  index: index + 1,
  before: pipCells(BEFORE).includes(index + 1),
  after: pipCells(AFTER).includes(index + 1),
}))
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="flex items-center justify-center gap-4">
      <!-- Moeda -->
      <div class="size-12 [perspective:240px]">
        <div class="relative size-full transition-transform duration-700 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateY(540deg)] group-focus-visible:[transform:rotateY(540deg)] motion-reduce:transition-none">
          <span class="absolute inset-0 grid place-items-center rounded-full border-2 border-tool bg-tool text-tool-foreground shadow-sm [backface-visibility:hidden]">
            <Star class="size-5 fill-current" />
          </span>
          <span class="absolute inset-0 grid place-items-center rounded-full border-2 border-tool bg-card text-tool shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <Crown class="size-5 fill-current" />
          </span>
        </div>
      </div>

      <!-- Dado -->
      <span class="grid size-12 grid-cols-3 grid-rows-3 rounded-xl border bg-muted p-1.5 shadow-sm transition-transform duration-500 group-hover:-rotate-6 group-focus-visible:-rotate-6 motion-reduce:transition-none">
        <span
          v-for="cell in cells"
          :key="cell.index"
          class="m-auto size-1.5 rounded-full transition-colors duration-300 motion-reduce:transition-none"
          :class="cell.before && cell.after ? 'bg-tool' : cell.before ? 'bg-tool group-hover:bg-transparent group-focus-visible:bg-transparent' : cell.after ? 'bg-transparent group-hover:bg-tool group-focus-visible:bg-tool' : ''"
        />
      </span>
    </div>

    <div class="mt-3 flex items-center justify-between">
      <span class="text-xs font-semibold tabular-nums">
        <span class="group-hover:hidden group-focus-visible:hidden">Cara · 3</span>
        <span class="hidden group-hover:inline group-focus-visible:inline">Coroa · 5</span>
      </span>
      <span class="rounded bg-tool px-1.5 py-0.5 text-xs font-semibold text-tool-foreground">Jogar</span>
    </div>
  </div>
</template>
