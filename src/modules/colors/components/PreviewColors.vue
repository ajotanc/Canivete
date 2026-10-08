<script setup lang="ts">
// Miniatura das cores: uma amostra e a escala de tons, com um tom que acende ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="h-10 rounded bg-tool" />
    <div class="mt-2 grid grid-cols-5 gap-1">
      <span class="h-4 rounded-sm bg-tool/20" />
      <span class="h-4 rounded-sm bg-tool/40" />
      <span class="h-4 rounded-sm bg-tool/60 transition-opacity duration-300 group-hover:opacity-40 group-focus-visible:opacity-40 motion-reduce:transition-none" />
      <span class="h-4 rounded-sm bg-tool/80" />
      <span class="h-4 rounded-sm bg-tool" />
    </div>
    <p class="mt-2 text-xs font-semibold tabular-nums text-muted-foreground">#2F5BEA</p>
  </div>
</template>
