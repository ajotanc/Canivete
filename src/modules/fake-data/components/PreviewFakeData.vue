<script setup lang="ts">
// Miniatura dos dados fictícios: uma ficha com avatar e linhas; o CPF ganha a cor da ferramenta ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="flex items-center gap-2">
      <span class="size-6 rounded-full bg-muted" />
      <span class="text-xs font-semibold">Ana Alves</span>
    </div>
    <div class="mt-3 space-y-1.5">
      <p class="text-xs tabular-nums text-muted-foreground transition-colors duration-300 group-hover:text-tool group-focus-visible:text-tool motion-reduce:transition-none">123.456.789-09</p>
      <div class="h-1.5 w-4/5 rounded-full bg-muted" />
      <div class="h-1.5 w-2/3 rounded-full bg-muted" />
    </div>
  </div>
</template>
