<script setup lang="ts">
// Miniatura da consulta de CEP: o campo com o número e o endereço, que aparece ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="rounded bg-muted px-2 py-1.5 text-xs font-semibold tabular-nums">01310-<span class="text-tool">100</span></p>
    <div class="mt-3 space-y-1.5 opacity-60 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
      <p class="text-xs font-semibold">Av. Paulista</p>
      <div class="h-1.5 w-4/5 rounded-full bg-muted" />
      <div class="h-1.5 w-2/3 rounded-full bg-muted" />
    </div>
  </div>
</template>
