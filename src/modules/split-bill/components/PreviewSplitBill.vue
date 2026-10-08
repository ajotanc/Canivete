<script setup lang="ts">
// Miniatura do racha-conta: o valor de cada um e as fichas das pessoas, que acendem ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="text-xs text-muted-foreground">Cada um paga</p>
    <p class="text-2xl font-semibold leading-none tabular-nums">R$ 55,00</p>
    <div class="mt-3 flex gap-1.5">
      <span v-for="person in 4" :key="person" class="size-6 rounded-full bg-muted transition-colors duration-300 group-hover:bg-tool group-focus-visible:bg-tool motion-reduce:transition-none" />
    </div>
  </div>
</template>
