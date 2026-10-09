<script setup lang="ts">
// Miniatura do placar: dois jogadores, cada um com a sua cor; no hover quem lidera ganha a coroa e o ponto a mais.
import { Crown } from '@lucide/vue'
</script>

<template>
  <div class="w-44 space-y-2 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div data-tool="cobalt" class="flex items-center gap-2">
      <span class="flex size-6 items-center justify-center rounded-chip border border-tool/20 bg-tool text-tool-foreground"><Crown class="size-3.5" /></span>
      <span class="flex-1 text-xs font-semibold">Ana</span>
      <span class="relative h-6 w-8 overflow-hidden text-right font-display text-2xl leading-6 font-semibold text-tool tabular-nums">
        <span class="block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-6 group-focus-visible:-translate-y-6 motion-reduce:transition-none">12</span>
        <span class="block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-6 group-focus-visible:-translate-y-6 motion-reduce:transition-none">13</span>
      </span>
    </div>
    <div class="h-1 overflow-hidden rounded-full bg-muted"><div data-tool="cobalt" class="h-full w-3/5 rounded-full bg-tool transition-[width] duration-300 group-hover:w-2/3 group-focus-visible:w-2/3 motion-reduce:transition-none" /></div>
    <div data-tool="berry" class="flex items-center gap-2">
      <span class="flex size-6 items-center justify-center rounded-chip border border-tool/20 bg-tool/10 text-[0.625rem] font-semibold text-tool">2º</span>
      <span class="flex-1 text-xs font-semibold">Bruno</span>
      <span class="font-display text-lg leading-6 font-semibold tabular-nums">9</span>
    </div>
    <div class="h-1 overflow-hidden rounded-full bg-muted"><div data-tool="berry" class="h-full w-2/5 rounded-full bg-tool" /></div>
  </div>
</template>
