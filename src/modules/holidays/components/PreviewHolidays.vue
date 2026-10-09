<script setup lang="ts">
// Miniatura da lista de feriados: duas datas com o nome, a primeira destacada ao passar o mouse.
</script>

<template>
  <div class="w-44 space-y-2 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="flex items-center gap-2">
      <span class="w-9 rounded bg-muted py-0.5 text-center text-xs font-semibold tabular-nums transition-colors duration-300 group-hover:bg-tool/20 group-focus-visible:bg-tool/20 motion-reduce:transition-none">07/09</span>
      <span class="text-xs font-semibold">Independência</span>
    </div>
    <div class="flex items-center gap-2 opacity-60">
      <span class="w-9 rounded bg-muted py-0.5 text-center text-xs font-semibold tabular-nums">12/10</span>
      <div class="h-1.5 w-14 rounded-full bg-muted" />
    </div>
  </div>
</template>
