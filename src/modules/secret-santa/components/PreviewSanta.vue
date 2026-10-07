<script setup lang="ts">
// Miniatura do amigo secreto: o PIN de 4 dígitos se preenche quando o card recebe foco ou mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="text-xs font-medium text-muted-foreground">Seu PIN</p>
    <div class="mt-2 flex justify-center gap-1.5">
      <span v-for="n in 4" :key="n" class="flex size-9 items-center justify-center rounded-lg border">
        <span
          class="size-1.5 rounded-full bg-tool opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
          :style="{ transitionDelay: `${n * 110}ms` }"
        />
      </span>
    </div>
    <div class="mt-3 flex h-9 items-center justify-center rounded-lg bg-tool text-xs font-semibold text-tool-foreground">Ver meu par</div>
  </div>
</template>
