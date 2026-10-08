<script setup lang="ts">
import { ExternalLink, Gift } from '@lucide/vue'
import type { WishItem } from '../lib/api'

defineProps<{ items: WishItem[]; name?: string }>()

/** Endereço curto para mostrar de onde é o link ("loja.com.br"); vazio se a URL não puder ser lida. */
function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// Cartão rounded-xl com p-2: o ícone e a tag por dentro usam o raio do cartão menos o respiro (e a borda de 1px), para as curvas ficarem paralelas.
</script>

<template>
  <ul v-if="items.length > 0" class="space-y-2">
    <li v-for="item in items" :key="item.text">
      <component
        :is="item.url ? 'a' : 'div'"
        :href="item.url"
        :target="item.url ? '_blank' : undefined"
        :rel="item.url ? 'noopener noreferrer nofollow' : undefined"
        class="group flex min-h-14 items-center gap-3 rounded-xl border bg-card p-2 outline-none"
        :class="item.url && 'transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none'"
      >
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-[calc(var(--radius-xl)-9px)]"
          :class="item.url ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'"
          aria-hidden="true"
        >
          <Gift class="size-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block break-words font-medium">{{ item.text }}</span>
          <span v-if="item.url && host(item.url)" class="block truncate text-sm text-muted-foreground">{{ host(item.url) }}</span>
        </span>
        <ExternalLink v-if="item.url" class="mr-2 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary motion-reduce:transition-none" aria-hidden="true" />
        <span v-if="item.url" class="sr-only">(abre o produto em outra aba)</span>
      </component>
    </li>
  </ul>
  <div v-else class="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center">
    <span class="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true"><Gift class="size-5" /></span>
    <p class="font-medium">{{ name ? `${name} ainda não escreveu nada` : 'Ainda não escreveu nada' }}</p>
    <p class="text-sm text-muted-foreground">Dá para mandar uma pergunta anônima aqui embaixo e descobrir o que a pessoa gosta.</p>
  </div>
</template>
