<script setup lang="ts">
// Miniatura da calculadora de datas: uma linha de dias com o intervalo marcado, que se alarga ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="grid grid-cols-7 gap-1">
      <span v-for="day in 14" :key="day" class="h-3 rounded-sm bg-muted transition-colors duration-300 motion-reduce:transition-none" :class="day >= 4 && day <= 8 ? 'bg-tool' : day === 9 ? 'group-hover:bg-tool group-focus-visible:bg-tool' : ''" />
    </div>
    <div class="mt-3 flex items-baseline justify-between">
      <span class="text-lg font-semibold leading-none tabular-nums">30</span>
      <span class="text-xs text-muted-foreground">dias</span>
    </div>
  </div>
</template>
