<script setup lang="ts">
// Miniatura do UUID e hash: um UUID com os trechos fixos na cor da ferramenta.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="break-all text-xs font-semibold leading-snug tabular-nums">
      9b1deb4d-3b7d-<span class="text-tool">4</span>bad-<span class="text-tool transition-opacity duration-300 group-hover:opacity-40 group-focus-visible:opacity-40 motion-reduce:transition-none">9</span>bdd-2b0d7b3dcb6d
    </p>
    <div class="mt-3 flex gap-1 text-xs font-semibold">
      <span class="rounded bg-tool px-1.5 py-0.5 text-tool-foreground">v4</span>
      <span class="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">SHA-256</span>
    </div>
  </div>
</template>
