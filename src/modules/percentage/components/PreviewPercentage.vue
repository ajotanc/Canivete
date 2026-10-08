<script setup lang="ts">
// Miniatura da calculadora de porcentagem: a conta e o resultado, que ganha a cor da ferramenta ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="text-xs text-muted-foreground tabular-nums">15% de 200</p>
    <p class="mt-1 text-2xl font-semibold leading-none tabular-nums transition-colors duration-300 group-hover:text-tool group-focus-visible:text-tool motion-reduce:transition-none">30</p>
    <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
      <div class="h-full w-[15%] rounded-full bg-tool transition-[width] duration-500 group-hover:w-1/3 group-focus-visible:w-1/3 motion-reduce:transition-none" />
    </div>
  </div>
</template>
