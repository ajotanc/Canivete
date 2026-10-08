<script setup lang="ts">
// Miniatura das ferramentas de texto: o texto em minúsculas vira maiúsculas ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="text-xs font-semibold">
      <span class="group-hover:hidden group-focus-visible:hidden">olá, mundo</span>
      <span class="hidden group-hover:inline group-focus-visible:inline">OLÁ, MUNDO</span>
    </p>
    <div class="mt-3 flex gap-1 text-xs font-semibold">
      <span class="rounded bg-tool px-1.5 py-0.5 text-tool-foreground">Aa</span>
      <span class="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">snake_</span>
      <span class="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">b64</span>
    </div>
  </div>
</template>
