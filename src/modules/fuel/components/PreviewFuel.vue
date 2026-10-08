<script setup lang="ts">
// Miniatura do comparador: duas barras de preço; a do etanol acende ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="space-y-2 text-xs font-semibold tabular-nums">
      <div class="flex items-center gap-2"><span class="w-9 text-muted-foreground">Gas.</span><span class="h-2 w-full rounded-full bg-muted" /><span>5,89</span></div>
      <div class="flex items-center gap-2">
        <span class="w-9 text-muted-foreground">Etan.</span>
        <span class="h-2 w-2/3 rounded-full bg-tool transition-[width] duration-500 group-hover:w-1/2 group-focus-visible:w-1/2 motion-reduce:transition-none" />
        <span>3,99</span>
      </div>
    </div>
    <p class="mt-3 text-xs font-semibold text-tool">Etanol compensa</p>
  </div>
</template>
