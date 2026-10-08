<script setup lang="ts">
// Miniatura do formatador: o JSON numa linha só vira linhas recuadas ao passar o mouse.
</script>

<template>
  <div class="w-44 rounded-md bg-card p-3 text-card-foreground shadow-[0_6px_16px_-6px_rgb(14_20_32/0.45)]" aria-hidden="true">
    <p class="text-xs font-semibold group-hover:hidden group-focus-visible:hidden">{"a":1,"b":[2]}</p>
    <div class="hidden space-y-1 text-xs font-semibold group-hover:block group-focus-visible:block">
      <p>{</p>
      <p class="pl-3"><span class="text-tool">"a"</span>: 1,</p>
      <p class="pl-3"><span class="text-tool">"b"</span>: [2]</p>
      <p>}</p>
    </div>
    <div class="mt-3 flex items-center gap-1.5 text-xs font-semibold text-tool">
      <span class="size-2 rounded-full bg-tool" />
      válido
    </div>
  </div>
</template>
