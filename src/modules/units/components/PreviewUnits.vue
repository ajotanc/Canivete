<script setup lang="ts">
// Miniatura do conversor: duas medidas lado a lado; a seta gira ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="flex items-center justify-between gap-2 text-xs font-semibold tabular-nums">
      <span class="rounded bg-muted px-1.5 py-1">1 km</span>
      <span class="text-tool transition-transform duration-300 group-hover:rotate-180 group-focus-visible:rotate-180 motion-reduce:transition-none">⇄</span>
      <span class="rounded bg-tool px-1.5 py-1 text-tool-foreground">1000 m</span>
    </div>
    <div class="mt-3 space-y-1.5">
      <div class="h-1.5 w-full rounded-full bg-muted" />
      <div class="h-1.5 w-3/5 rounded-full bg-muted" />
    </div>
  </div>
</template>
