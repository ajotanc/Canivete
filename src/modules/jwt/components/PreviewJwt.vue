<script setup lang="ts">
// Miniatura do decodificador de JWT: o token em três cores e o aviso de validade, que acende ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="break-all text-xs font-semibold leading-snug">
      <span class="text-info">eyJhbGci</span><span class="text-muted-foreground">.</span><span class="text-success">eyJzdWIi</span><span class="text-muted-foreground">.</span><span class="text-warning">SflKxwRJ</span>
    </p>
    <div class="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors duration-300 group-hover:text-tool group-focus-visible:text-tool motion-reduce:transition-none">
      <span class="size-2 rounded-full bg-current" />
      assinatura confere
    </div>
  </div>
</template>
