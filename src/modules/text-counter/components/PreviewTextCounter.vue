<script setup lang="ts">
// Miniatura do contador: linhas de texto, a contagem e a barra de limite que enche ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="space-y-1.5">
      <div class="h-1.5 w-full rounded-full bg-muted" />
      <div class="h-1.5 w-4/5 rounded-full bg-muted" />
      <div class="h-1.5 w-2/3 rounded-full bg-muted" />
    </div>
    <div class="mt-3 flex items-baseline justify-between">
      <span class="text-lg font-semibold leading-none tabular-nums">142</span>
      <span class="text-xs text-muted-foreground">/ 280</span>
    </div>
    <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
      <div class="h-full w-1/2 rounded-full bg-tool transition-[width] duration-500 group-hover:w-5/6 group-focus-visible:w-5/6 motion-reduce:transition-none" />
    </div>
  </div>
</template>
