<script setup lang="ts">
import { ArrowRight, Download, Search, SearchX, Wrench, X, Zap } from '@lucide/vue'
import { computed, ref, useTemplateRef } from 'vue'
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
const visibleTools = computed(() => filterTools(tools, query.value, null))

const searchInput = useTemplateRef<{ $el: HTMLInputElement }>('searchInput')

/** Limpa a busca e devolve o foco ao campo, para a pessoa já digitar outra coisa. */
function clearFilters() {
  query.value = ''
  searchInput.value?.$el?.focus()
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader
      filled
      size="lg"
      :icon="Wrench"
      title="Ferramentas para o dia a dia"
      description="Escolha uma ferramenta e use na hora, sem criar conta."
    >
      <FactList>
        <FactTile :icon="Wrench" label="Ferramentas">{{ tools.length }}</FactTile>
        <FactTile :icon="Download" label="Instalável">Como app</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="space-y-2 sm:max-w-md">
      <InputGroup class="h-12 rounded-xl bg-card">
        <InputGroupAddon class="pl-4">
          <Search class="size-5" aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          ref="searchInput"
          v-model="query"
          type="search"
          enterkeyhint="search"
          data-home-search
          aria-label="Buscar ferramenta"
          placeholder="Buscar ferramenta"
          class="h-12 text-base [&::-webkit-search-cancel-button]:appearance-none"
          @keydown.esc="clearFilters"
        />
        <InputGroupAddon align="inline-end" class="pr-1.5">
          <button
            v-if="query"
            type="button"
            class="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-hidden"
            aria-label="Limpar busca"
            @click="clearFilters"
          >
            <span class="flex size-6 items-center justify-center rounded-full bg-muted"><X class="size-3.5" aria-hidden="true" /></span>
          </button>
          <Kbd v-else class="mr-2 max-sm:hidden">/</Kbd>
        </InputGroupAddon>
      </InputGroup>
      <p v-if="query && visibleTools.length > 0" class="px-1 text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {{ visibleTools.length === 1 ? '1 ferramenta encontrada' : `${visibleTools.length} ferramentas encontradas` }}
      </p>
    </div>

    <EmptyState v-if="visibleTools.length === 0" :icon="SearchX" description="Nenhuma ferramenta encontrada. Tente outra palavra.">
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
              <Badge variant="tool-tint">{{ tool.category }}</Badge>
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
