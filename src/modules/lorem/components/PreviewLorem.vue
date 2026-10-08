<script setup lang="ts">
// Miniatura do lorem ipsum: linhas de texto, com a primeira na cor da ferramenta; o parágrafo cresce ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="text-xs font-semibold leading-snug"><span class="text-tool">Lorem ipsum</span> dolor sit amet</p>
    <div class="mt-2 space-y-1.5">
      <div class="h-1.5 w-full rounded-full bg-muted" />
      <div class="h-1.5 w-5/6 rounded-full bg-muted" />
      <div class="h-1.5 w-2/3 rounded-full bg-muted transition-[width] duration-500 group-hover:w-full group-focus-visible:w-full motion-reduce:transition-none" />
    </div>
  </div>
</template>
