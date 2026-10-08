<script setup lang="ts">
// Miniatura da compressão de imagem: uma foto desenhada e o peso, que cai ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="relative h-14 overflow-hidden rounded bg-muted">
      <span class="absolute right-2 top-2 size-3 rounded-full bg-tool" />
      <span class="absolute -bottom-3 left-2 size-10 rotate-45 rounded-md bg-tool/70" />
      <span class="absolute -bottom-4 left-10 size-10 rotate-45 rounded-md bg-tool/40" />
    </div>
    <p class="mt-2 flex items-baseline justify-between text-xs font-semibold tabular-nums">
      <span class="text-muted-foreground line-through">2,4 MB</span>
      <span class="text-tool transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110 motion-reduce:transition-none">340 kB</span>
    </p>
  </div>
</template>
