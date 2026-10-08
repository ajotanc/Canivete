<script setup lang="ts">
// Miniatura da calculadora de horas: dois horários e o total, que ganha a cor da ferramenta ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="flex items-center justify-between text-xs font-semibold tabular-nums text-muted-foreground">
      <span class="rounded bg-muted px-1.5 py-0.5">08:00</span>
      <span>→</span>
      <span class="rounded bg-muted px-1.5 py-0.5">17:00</span>
    </div>
    <p class="mt-3 text-2xl font-semibold leading-none tabular-nums transition-colors duration-300 group-hover:text-tool group-focus-visible:text-tool motion-reduce:transition-none">8:00</p>
    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
      <div class="h-full w-2/3 rounded-full bg-tool transition-[width] duration-500 group-hover:w-full group-focus-visible:w-full motion-reduce:transition-none" />
    </div>
  </div>
</template>
