<script setup lang="ts">
// Miniatura da moeda e do dado: a moeda vira ao passar o mouse.
</script>

<template>
  <div class="flex w-44 items-center justify-around rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <span class="flex size-12 items-center justify-center rounded-full border-2 border-tool bg-tool/20 text-xs font-semibold transition-transform duration-500 group-hover:rotate-y-180 group-focus-visible:rotate-y-180 motion-reduce:transition-none">Cara</span>
    <span class="grid size-12 grid-cols-3 grid-rows-3 gap-0.5 rounded-lg border bg-muted p-1.5">
      <span class="col-start-1 row-start-1 size-2 rounded-full bg-tool" />
      <span class="col-start-2 row-start-2 size-2 rounded-full bg-tool" />
      <span class="col-start-3 row-start-3 size-2 rounded-full bg-tool" />
    </span>
  </div>
</template>
