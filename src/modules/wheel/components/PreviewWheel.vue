<script setup lang="ts">
// Miniatura da roleta: fatias em conic-gradient com o ponteiro em cima; a roleta gira ao passar o mouse.
</script>

<template>
  <div class="relative flex w-44 items-center justify-center rounded-md bg-card p-3 shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <span class="absolute left-1/2 top-1.5 z-10 h-3 w-3 -translate-x-1/2 bg-foreground [clip-path:polygon(50%_100%,0_0,100%_0)]" />
    <span
      class="size-20 rounded-full border-2 border-card bg-[conic-gradient(var(--tool)_0_25%,var(--muted)_0_50%,var(--tool)_0_75%,var(--muted)_0_100%)] shadow-sm transition-transform duration-[900ms] ease-out group-hover:rotate-[300deg] group-focus-visible:rotate-[300deg] motion-reduce:transition-none"
    />
    <span class="absolute size-4 rounded-full border bg-card" />
  </div>
</template>
