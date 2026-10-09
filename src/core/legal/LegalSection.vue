<script setup lang="ts">
/** Uma seção da política de privacidade ou dos termos: título numerado e o texto, em parágrafos e listas. */
defineProps<{ id: string; title: string }>()
</script>

<template>
  <section :id="id" class="scroll-mt-24 space-y-3" :aria-labelledby="`${id}-title`">
    <h2 :id="`${id}-title`" class="text-xl">{{ title }}</h2>
    <div class="space-y-3 text-pretty leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
      <slot />
    </div>
  </section>
</template>
