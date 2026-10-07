<script setup lang="ts">
// Miniatura da ferramenta: o link wa.me e um QR Code estilizado que acende ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="truncate rounded bg-muted px-1.5 py-1 font-mono text-xs font-semibold"><span class="text-tool">wa.me</span>/5511…</p>
    <div class="mt-3 flex items-center justify-center">
      <svg viewBox="0 0 7 7" class="size-16" fill="currentColor" shape-rendering="crispEdges">
        <path d="M0 0h3v3H0zM4 0h3v3H4zM0 4h3v3H0z" class="text-muted-foreground/70" />
        <path d="M1 1h1v1H1zM5 1h1v1H5zM1 5h1v1H1z" class="text-card" />
        <path d="M4 4h1v1H4zM6 4h1v1H6zM5 5h1v1H5zM4 6h1v1H4zM6 6h1v1H6z" class="text-tool" />
      </svg>
    </div>
  </div>
</template>
