<script setup lang="ts">
import { ExternalLink, Gift } from '@lucide/vue'
import type { WishItem } from '../lib/api'

defineProps<{ items: WishItem[] }>()

// Cartão rounded-xl com p-2: o ícone e a tag por dentro usam o raio do cartão menos o respiro (e a borda de 1px), para as curvas ficarem paralelas.
</script>

<template>
  <ul class="space-y-2">
    <li v-for="item in items" :key="item.text">
      <component
        :is="item.url ? 'a' : 'div'"
        :href="item.url"
        :target="item.url ? '_blank' : undefined"
        :rel="item.url ? 'noopener noreferrer nofollow' : undefined"
        class="flex min-h-14 items-center gap-3 rounded-xl border bg-card p-2 outline-none"
        :class="item.url && 'transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none'"
      >
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-[calc(var(--radius-xl)-9px)]"
          :class="item.url ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'"
          aria-hidden="true"
        >
          <Gift class="size-5" />
        </span>
        <span class="min-w-0 flex-1 break-words font-medium">{{ item.text }}</span>
        <span
          v-if="item.url"
          class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[calc(var(--radius-xl)-9px)] border border-primary/40 px-3 text-sm font-semibold text-primary"
        >
          Ver produto
          <ExternalLink class="size-4" aria-hidden="true" />
        </span>
      </component>
    </li>
  </ul>
</template>
