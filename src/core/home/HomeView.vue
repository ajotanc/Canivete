<script setup lang="ts">
import { ArrowRight, Download, LayoutGrid, MessageCircle, Search, SearchX, TerminalSquare, Dices, Wrench, Zap } from '@lucide/vue'
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/EmptyState.vue'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Kbd } from '@/components/ui/kbd'
import { filterTools } from '@/core/home/filterTools'
import { tools } from '@/core/modules/registry'

/** Ícone de cada categoria no filtro; categorias novas caem no ícone genérico. */
const CATEGORY_ICONS: Record<string, Component> = { Comunicação: MessageCircle, Desenvolvimento: TerminalSquare, Sorteios: Dices }

const query = ref('')
/** 'all' mostra tudo; qualquer outro valor é o nome de uma categoria. */
const category = ref('all')

const categories = computed(() => [...new Set(tools.map((tool) => tool.category))].sort())
const visibleTools = computed(() => filterTools(tools, query.value, category.value === 'all' ? null : category.value))

/** "Todas" mais uma opção por categoria, cada uma com quantas ferramentas tem. */
const options = computed(() => [
  { value: 'all', label: 'Todas', count: tools.length, icon: LayoutGrid },
  ...categories.value.map((name) => ({ value: name, label: name, count: tools.filter((tool) => tool.category === name).length, icon: CATEGORY_ICONS[name] ?? LayoutGrid })),
])

function clearFilters() {
  query.value = ''
  category.value = 'all'
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader
      filled
      size="lg"
      :icon="Wrench"
      title="Ferramentas para o dia a dia"
      description="Abra, resolva e compartilhe o resultado. Sem cadastro para usar."
    >
      <FactList>
        <FactTile :icon="Wrench" label="Ferramentas">{{ tools.length }}</FactTile>
        <FactTile :icon="Download" label="Instalável">Como app</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <InputGroup class="bg-card sm:max-w-sm">
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput v-model="query" type="search" aria-label="Buscar ferramenta" placeholder="Buscar ferramenta" />
        <InputGroupAddon align="inline-end" class="max-sm:hidden">
          <Kbd>/</Kbd>
        </InputGroupAddon>
      </InputGroup>
      <div role="group" aria-label="Filtrar por categoria" class="grid grid-cols-2 gap-1 rounded-2xl border bg-muted/60 p-1 sm:flex sm:w-fit">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          :aria-pressed="category === option.value"
          class="group flex h-11 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium sm:gap-2 sm:px-3 outline-none transition-[background-color,box-shadow,color] focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
          :class="category === option.value ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'"
          @click="category = option.value"
        >
          <component :is="option.icon" class="size-4 shrink-0" :class="category === option.value ? 'text-primary' : ''" aria-hidden="true" />
          <span class="min-w-0 flex-1 truncate text-left">{{ option.label }}</span>
          <span class="hidden rounded-md px-1.5 py-0.5 text-xs tabular-nums sm:inline" :class="category === option.value ? 'bg-primary/10 text-primary' : 'bg-foreground/5'">{{ option.count }}</span>
        </button>
      </div>
    </div>

    <EmptyState v-if="visibleTools.length === 0" :icon="SearchX" description="Nenhuma ferramenta encontrada. Tente outra palavra ou mostre todas as categorias.">
      <button type="button" class="text-sm font-medium underline underline-offset-4" @click="clearFilters">Limpar busca</button>
    </EmptyState>

    <ul v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Ferramentas">
      <li v-for="tool in visibleTools" :key="tool.id" class="contents">
        <RouterLink
          :to="`/${tool.id}`"
          :data-tool="tool.color ?? 'cobalt'"
          class="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(14_20_32/0.06)] outline-none transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgb(14_20_32/0.35)] focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <div class="flex h-44 items-center justify-center bg-tool text-tool-foreground">
            <component :is="tool.preview" v-if="tool.preview" />
            <component :is="tool.icon" v-else class="size-12" aria-hidden="true" />
          </div>
          <div class="flex flex-1 flex-col gap-4 p-5">
            <div class="space-y-1.5">
              <div class="flex items-center gap-3">
                <span class="flex size-12 shrink-0 items-center justify-center rounded-chip bg-tool text-tool-foreground">
                  <component :is="tool.icon" class="size-6" aria-hidden="true" />
                </span>
                <h2 class="text-xl font-semibold">{{ tool.title }}</h2>
              </div>
              <p class="text-pretty text-muted-foreground">{{ tool.description }}</p>
            </div>
            <div class="mt-auto flex items-center justify-between">
              <Badge variant="secondary" class="rounded-md font-medium">{{ tool.category }}</Badge>
              <span class="flex items-center gap-1.5 text-sm font-semibold">
                Abrir
                <ArrowRight class="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
              </span>
            </div>
          </div>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
