<script setup lang="ts">
// Miniatura do gerador: as letras do CNPJ novo ficam na cor da ferramenta; o botão "Gerar" acende ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="flex gap-1 text-xs font-semibold">
      <span class="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">CPF</span>
      <span class="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">CNPJ</span>
      <span class="rounded bg-tool px-1.5 py-0.5 text-tool-foreground">A–Z</span>
    </div>
    <p class="mt-3 font-mono text-xs font-semibold tracking-tight">12.<span class="text-tool">ABC</span>.345/01<span class="text-tool">DE</span>-35</p>
    <div
      class="mt-3 flex h-9 items-center justify-center rounded-lg bg-muted text-xs font-semibold transition-colors duration-300 group-hover:bg-tool group-hover:text-tool-foreground group-focus-visible:bg-tool group-focus-visible:text-tool-foreground motion-reduce:transition-none"
    >
      Gerar
    </div>
  </div>
</template>
