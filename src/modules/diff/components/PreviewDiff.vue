<script setup lang="ts">
// Miniatura do comparador: linhas iguais, uma removida e uma nova; a nova se alarga ao passar o mouse.
</script>

<template>
  <div class="w-44 space-y-1.5 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="h-2 w-full rounded-full bg-muted" />
    <div class="flex items-center gap-1.5 rounded bg-destructive/15 px-1 py-0.5">
      <span class="text-xs font-semibold text-destructive">−</span>
      <span class="h-2 w-3/4 rounded-full bg-destructive/40" />
    </div>
    <div class="flex items-center gap-1.5 rounded bg-success/15 px-1 py-0.5">
      <span class="text-xs font-semibold text-success">+</span>
      <span class="h-2 w-2/3 rounded-full bg-success/50 transition-[width] duration-500 group-hover:w-5/6 group-focus-visible:w-5/6 motion-reduce:transition-none" />
    </div>
    <div class="h-2 w-5/6 rounded-full bg-muted" />
  </div>
</template>
