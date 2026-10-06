<script setup lang="ts">
defineProps<{ name: string; revealed: boolean }>()
</script>

<template>
  <div class="mx-auto w-full max-w-xs [perspective:900px]">
    <!-- O barbante e o furo da etiqueta -->
    <div class="mx-auto h-6 w-1 rounded-full bg-[#3B82F6]" aria-hidden="true" />
    <div
      class="relative h-40 transition-transform duration-300 ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
      :class="revealed ? '[transform:rotateY(180deg)] motion-reduce:[transform:none]' : ''"
    >
      <!-- Frente: etiqueta fechada -->
      <div
        class="absolute inset-0 flex items-center justify-center rounded-2xl bg-secondary text-secondary-foreground [backface-visibility:hidden] motion-reduce:data-[revealed=true]:hidden"
        :data-revealed="revealed"
        aria-hidden="true"
      >
        <span class="size-4 rounded-full border-2 border-secondary-foreground" />
      </div>
      <!-- Verso: o nome, só existe no DOM quando revelado -->
      <div
        class="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-secondary bg-card p-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] motion-reduce:[transform:none]"
        :class="revealed ? '' : 'motion-reduce:hidden'"
        aria-live="polite"
      >
        <span v-if="revealed" class="font-display text-3xl leading-tight text-card-foreground">{{ name }}</span>
      </div>
    </div>
  </div>
</template>
