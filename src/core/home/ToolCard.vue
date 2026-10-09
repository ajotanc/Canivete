<script setup lang="ts">
import { ArrowRight, Star } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Badge } from '@/components/ui/badge'
import { categoryKey, toolColor } from '@/core/modules/categories'
import type { ToolManifest } from '@/core/modules/types'
import { isFavorite, toggleFavorite } from './favorites'

/**
 * Card de uma ferramenta na home: faixa na cor de cabo com a miniatura, ícone, título, descrição e a tag da categoria na cor dela.
 * A estrela (favoritar) fica solta no canto da faixa, na cor do texto da faixa (vazada ou cheia), fora do link,
 * para não abrir a ferramenta ao tocar nela. A área de toque continua com 44px.
 */
const props = defineProps<{ tool: ToolManifest }>()
const favorite = computed(() => isFavorite(props.tool.id))
</script>

<template>
  <div class="relative flex">
    <RouterLink
      :to="`/${tool.id}`"
      :data-tool="toolColor(tool)"
      class="group flex w-full flex-col overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(14_20_32/0.06)] outline-none transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgb(14_20_32/0.35)] focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div class="flex h-44 items-center justify-center bg-tool text-tool-foreground">
        <component :is="tool.preview" v-if="tool.preview" />
        <component :is="tool.icon" v-else class="size-12" aria-hidden="true" />
      </div>
      <div class="flex flex-1 flex-col gap-4 p-5">
        <div class="space-y-1.5">
          <div class="flex items-center gap-3">
            <span class="flex size-12 shrink-0 items-center justify-center rounded-chip border border-tool/20 bg-tool text-tool-foreground">
              <component :is="tool.icon" class="size-6" aria-hidden="true" />
            </span>
            <h2 class="text-xl font-semibold">{{ tool.title }}</h2>
          </div>
          <p class="text-pretty text-muted-foreground">{{ tool.description }}</p>
        </div>
        <div class="mt-auto flex items-center justify-between">
          <Badge variant="category" :data-category="categoryKey(tool.category)">{{ tool.category }}</Badge>
          <span class="flex items-center gap-1.5 text-sm font-semibold">
            Abrir
            <ArrowRight class="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
          </span>
        </div>
      </div>
    </RouterLink>
    <button
      type="button"
      class="absolute top-1.5 right-1.5 flex size-11 items-center justify-center rounded-lg text-tool-foreground transition-transform duration-200 outline-none hover:scale-110 focus-visible:ring-3 focus-visible:ring-tool-foreground/70 active:scale-95 motion-reduce:transition-none"
      :data-tool="toolColor(tool)"
      :aria-pressed="favorite"
      :aria-label="favorite ? `Tirar ${tool.title} das favoritas` : `Favoritar ${tool.title}`"
      :title="favorite ? 'Tirar das favoritas' : 'Favoritar'"
      @click="toggleFavorite(tool.id)"
    >
      <Star class="size-6 transition-[fill,opacity] duration-200 motion-reduce:transition-none" :class="favorite ? 'fill-current' : 'opacity-80 hover:opacity-100'" aria-hidden="true" />
    </button>
  </div>
</template>
