<script setup lang="ts">
// Miniatura da lista de feriados: três datas com o nome; ao passar o mouse, o próximo feriado ganha a cor da ferramenta.
const ROWS = [
  { date: '07/09', name: 'Independência' },
  { date: '12/10', name: 'Aparecida' },
  { date: '02/11', name: 'Finados' },
] as const
</script>

<template>
  <div class="w-44 space-y-2 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div v-for="(row, index) in ROWS" :key="row.date" class="flex items-center gap-2" :class="index > 0 && 'opacity-60'">
      <span
        class="shrink-0 rounded-md border px-1.5 py-0.5 text-[0.6875rem] leading-none font-semibold tabular-nums transition-colors duration-300 motion-reduce:transition-none"
        :class="index === 0 ? 'border-border bg-muted group-hover:border-tool/30 group-hover:bg-tool/15 group-focus-visible:border-tool/30 group-focus-visible:bg-tool/15' : 'border-border bg-muted'"
      >{{ row.date }}</span>
      <span class="truncate text-xs font-semibold">{{ row.name }}</span>
    </div>
  </div>
</template>
