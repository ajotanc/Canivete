<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import type { WishItem } from '../lib/api'

defineProps<{ items: WishItem[] }>()

// Cartão rounded-xl com p-2: a tag por dentro usa o raio do cartão menos o respiro (e a borda de 1px), para as curvas ficarem paralelas.
</script>

<template>
  <ul class="space-y-2">
    <li v-for="item in items" :key="item.text">
      <a
        v-if="item.url"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer nofollow"
        class="flex min-h-14 items-center justify-between gap-3 rounded-xl border bg-card p-2 pl-4 text-left outline-none transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none"
      >
        <span class="min-w-0 break-words font-medium">{{ item.text }}</span>
        <span class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[calc(var(--radius-xl)-9px)] border border-primary/40 px-3 text-sm font-semibold text-primary">
          Ver produto
          <ExternalLink class="size-4" aria-hidden="true" />
        </span>
      </a>
      <p v-else class="flex min-h-14 items-center rounded-xl border bg-card px-4 py-2 font-medium">{{ item.text }}</p>
    </li>
  </ul>
</template>
