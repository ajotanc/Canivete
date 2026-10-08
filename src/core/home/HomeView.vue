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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { filterTools } from '@/core/home/filterTools'
import { tools } from '@/core/modules/registry'

const query = ref('')
/** 'all' mostra tudo; qualquer outro valor é o nome de uma categoria. */
const category = ref('all')

const categories = computed(() => [...new Set(tools.map((tool) => tool.category))].sort())
const visibleTools = computed(() => filterTools(tools, query.value, category.value === 'all' ? null : category.value))

/** O ToggleGroup devolve vazio ao clicar no item já ativo; volta para "todas". */
function onCategory(value: unknown) {
  category.value = typeof value === 'string' && value !== '' ? value : 'all'
}

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
      <ToggleGroup
        type="single"
        variant="outline"
        :model-value="category"
        aria-label="Filtrar por categoria"
        :spacing="2"
        class="w-full flex-wrap justify-start sm:w-auto"
        @update:model-value="onCategory"
      >
        <ToggleGroupItem value="all" class="bg-card px-4 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Todas</ToggleGroupItem>
        <ToggleGroupItem v-for="item in categories" :key="item" :value="item" class="bg-card px-4 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{{ item }}</ToggleGroupItem>
      </ToggleGroup>
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
