<script setup lang="ts">
import { Heart, LockKeyhole } from '@lucide/vue'
// Miniatura do amigo secreto: a carta confidencial. Ao passar o mouse (ou focar o card), o lacre de coração
// desliza pelo trilho, como no produto, e o nome do par aparece no lugar do aviso.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <div class="flex items-center gap-1.5">
      <span class="flex size-6 shrink-0 items-center justify-center rounded-chip bg-tool/10 text-tool">
        <LockKeyhole class="size-3" />
      </span>
      <p class="text-xs font-semibold leading-tight">Carta confidencial</p>
    </div>

    <div class="relative mt-2 h-9">
      <p class="absolute inset-0 flex items-center text-xs leading-tight text-muted-foreground transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0 motion-reduce:transition-none">
        Para abrir quando estiver pronto
      </p>
      <p class="absolute inset-0 flex flex-col justify-center opacity-0 transition-opacity delay-300 duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
        <span class="text-xs leading-tight text-muted-foreground">Você vai presentear</span>
        <span class="text-sm font-semibold leading-tight">Ana Beatriz</span>
      </p>
    </div>

    <div class="relative mt-2 h-8 rounded-full bg-tool/15 p-1">
      <span
        class="absolute inset-y-1 left-1 w-0 rounded-full bg-tool/30 transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-[calc(100%-0.5rem)] group-focus-visible:w-[calc(100%-0.5rem)] motion-reduce:transition-none"
      />
      <span
        class="relative flex size-6 items-center justify-center rounded-full bg-tool text-tool-foreground shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[7.5rem] group-focus-visible:translate-x-[7.5rem] motion-reduce:transition-none"
      >
        <Heart class="size-3 fill-current" />
      </span>
    </div>
  </div>
</template>
