<script setup lang="ts">
// Miniatura do cronômetro: o relógio e a barra de progresso, que avança ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="text-2xl font-semibold leading-none tabular-nums">25:00</p>
    <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
      <div class="h-full w-1/4 rounded-full bg-tool transition-[width] duration-700 group-hover:w-2/3 group-focus-visible:w-2/3 motion-reduce:transition-none" />
    </div>
    <div class="mt-2 flex gap-1 text-xs font-semibold">
      <span class="rounded bg-tool px-1.5 py-0.5 text-tool-foreground">Iniciar</span>
      <span class="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">Zerar</span>
    </div>
  </div>
</template>
