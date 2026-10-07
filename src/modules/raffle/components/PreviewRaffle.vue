<script setup lang="ts">
// Miniatura do sorteador: a marca de seleção desce pela lista quando o card recebe foco ou mouse.
const names = ['Ana Beatriz', 'Bruno Alves', 'Carla Souza', 'Diego Lima']
</script>

<template>
  <div class="relative w-44 overflow-hidden rounded-md bg-card p-1.5 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <span
      class="absolute inset-x-1.5 top-1.5 h-7 rounded bg-tool transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-14 group-focus-visible:translate-y-14 motion-reduce:transition-none"
    />
    <ul class="relative text-xs font-medium">
      <li v-for="(name, index) in names" :key="name" class="flex h-7 items-center gap-2 px-2">
        <span class="size-1.5 rounded-full bg-current opacity-30" />
        <span class="truncate" :class="index === 0 ? 'text-tool-foreground group-hover:text-card-foreground group-focus-visible:text-card-foreground' : ''">{{ name }}</span>
      </li>
    </ul>
  </div>
</template>
