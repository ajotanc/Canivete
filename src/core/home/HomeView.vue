<script setup lang="ts">
import { ArrowRight, Download, Search, SearchX, Wrench, Zap } from '@lucide/vue'
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

const query = ref('')
/** 'all' mostra tudo; qualquer outro valor é o nome de uma categoria. */
const category = ref('all')

const categories = computed(() => [...new Set(tools.map((tool) => tool.category))].sort())
const visibleTools = computed(() => filterTools(tools, query.value, category.value === 'all' ? null : category.value))

/** "Todas" mais uma opção por categoria, cada uma com quantas ferramentas tem. */
const options = computed(() => [
  { value: 'all', label: 'Todas', count: tools.length },
  ...categories.value.map((name) => ({ value: name, label: name, count: tools.filter((tool) => tool.category === name).length })),
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
      <div role="group" aria-label="Filtrar por categoria" class="flex flex-wrap gap-1.5">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          :aria-pressed="category === option.value"
          class="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
          :class="category === option.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'"
          @click="category = option.value"
        >
          {{ option.label }}
          <span class="text-xs tabular-nums opacity-60">{{ option.count }}</span>
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
