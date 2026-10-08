<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

/** Esqueleto do PageHeader preenchido: ícone em cima, título, descrição e as três caixas de fatos (duas e uma embaixo no estreito). */
defineProps<{ actions?: boolean }>()
</script>

<template>
  <div class="space-y-3 rounded-3xl bg-primary/10 p-5 sm:space-y-4 sm:p-8" aria-hidden="true">
    <div v-if="actions" class="flex min-h-11 items-center justify-between">
      <Skeleton class="h-5 w-28 bg-primary/20" />
      <Skeleton class="h-5 w-12 bg-primary/20" />
    </div>
    <Skeleton class="size-14 rounded-chip bg-primary/20" />
    <Skeleton class="h-9 w-2/3 bg-primary/20 sm:h-10" />
    <div class="space-y-2">
      <Skeleton class="h-4 w-full max-w-md bg-primary/20 sm:h-5" />
      <Skeleton class="h-4 w-2/3 max-w-sm bg-primary/20 sm:h-5" />
    </div>
    <div class="grid grid-cols-2 gap-2 pt-1 sm:gap-3 sm:pt-2">
      <Skeleton class="h-14 rounded-xl bg-primary/20 sm:h-15" />
      <Skeleton class="h-14 rounded-xl bg-primary/20 sm:h-15" />
      <Skeleton class="col-span-2 h-14 rounded-xl bg-card sm:h-15" />
    </div>
  </div>
</template>
