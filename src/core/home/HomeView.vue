<script setup lang="ts">
import { ArrowDownAZ, ArrowDownZA, Download, Layers, Search, SearchX, Shuffle, Star, Wrench, X, Zap } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { arrange, groupByCategory, SORT_MODES, type SortMode } from '@/core/home/arrange'
import { Kbd } from '@/components/ui/kbd'
import { favorites } from '@/core/home/favorites'
import { filterTools } from '@/core/home/filterTools'
import ToolCard from '@/core/home/ToolCard.vue'
import { CATEGORIES } from '@/core/modules/categories'
import { tools } from '@/core/modules/registry'
import { shuffle } from '@/lib/random'

const query = ref('')
const filtering = computed(() => query.value.trim() !== '')

/** Ordem e agrupamento escolhidos nos botões ao lado da busca; ficam salvos neste navegador. */
const sort = useStorage<SortMode>('canivete:home-sort', 'random')
const grouped = useStorage('canivete:home-grouped', false)
const SORT_OPTIONS: Record<SortMode, { label: string; icon: typeof Shuffle }> = {
  random: { label: 'aleatória', icon: Shuffle },
  az: { label: 'A a Z', icon: ArrowDownAZ },
  za: { label: 'Z a A', icon: ArrowDownZA },
}
const sortMode = computed<SortMode>(() => (SORT_MODES.includes(sort.value) ? sort.value : 'random'))
const nextSort = computed<SortMode>(() => SORT_MODES[(SORT_MODES.indexOf(sortMode.value) + 1) % SORT_MODES.length])

/** Sorteadas uma vez por visita: a ordem aleatória não muda enquanto a pessoa favorita ou agrupa. */
const randomOrder = shuffle(tools).map((tool) => tool.id)
const randomCategories = shuffle(CATEGORIES.map((category) => category.key))

const found = computed(() => filterTools(tools, query.value, null))
const isFavorite = (id: string) => favorites.value.includes(id)
/** Favoritas sempre numa seção própria no topo, na mesma ordem escolhida. */
const starred = computed(() => arrange(tools.filter((tool) => isFavorite(tool.id)), sortMode.value, randomOrder))
const rest = computed(() => arrange(tools.filter((tool) => !isFavorite(tool.id)), sortMode.value, randomOrder))
const groups = computed(() => groupByCategory(rest.value, sortMode.value, randomOrder, randomCategories))
/** Na busca: na aleatória vale a relevância (título primeiro); em A-Z e Z-A, a ordem pedida. Favoritas antes. */
const results = computed(() => {
  const list = sortMode.value === 'random' ? found.value : arrange(found.value, sortMode.value, randomOrder)
  return [...list].sort((a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id)))
})

const searchInput = useTemplateRef<{ $el: HTMLInputElement }>('searchInput')

/** Limpa a busca e devolve o foco ao campo, para a pessoa já digitar outra coisa. */
function clearSearch() {
  query.value = ''
  searchInput.value?.$el?.focus()
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled size="lg" :icon="Wrench" title="Ferramentas para o dia a dia" description="Escolha uma ferramenta e use na hora, sem criar conta.">
      <FactList>
        <FactTile :icon="Wrench" label="Ferramentas">{{ tools.length }}</FactTile>
        <FactTile :icon="Download" label="Instalável">Como app</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="space-y-4">
      <div class="flex gap-2 sm:max-w-xl">
        <InputGroup class="h-12 flex-1 rounded-xl bg-card">
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
            @keydown.esc="clearSearch"
          />
          <InputGroupAddon align="inline-end" class="pr-1.5">
            <button
              v-if="query"
              type="button"
              class="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-hidden"
              aria-label="Limpar busca"
              @click="clearSearch"
            >
              <span class="flex size-6 items-center justify-center rounded-full bg-muted"><X class="size-3.5" aria-hidden="true" /></span>
            </button>
            <Kbd v-else class="mr-2 max-sm:hidden">/</Kbd>
          </InputGroupAddon>
        </InputGroup>

        <!-- Ordem: cada toque passa para a próxima (aleatória, A a Z, Z a A); o ícone mostra a atual -->
        <Button
          variant="outline"
          size="icon"
          class="size-12 shrink-0 rounded-xl"
          :class="sortMode === 'random' ? 'bg-card' : 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'"
          :aria-label="`Ordem ${SORT_OPTIONS[sortMode].label}. Tocar muda para ${SORT_OPTIONS[nextSort].label}`"
          :title="`Ordem ${SORT_OPTIONS[sortMode].label}`"
          @click="sort = nextSort"
        >
          <component :is="SORT_OPTIONS[sortMode].icon" class="size-5" aria-hidden="true" />
        </Button>

        <!-- Separar por categoria: liga e desliga -->
        <Button
          variant="outline"
          size="icon"
          class="size-12 shrink-0 rounded-xl"
          :class="grouped ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : 'bg-card'"
          :aria-pressed="grouped"
          aria-label="Separar por categoria"
          :title="grouped ? 'Juntar as categorias' : 'Separar por categoria'"
          @click="grouped = !grouped"
        >
          <Layers class="size-5" aria-hidden="true" />
        </Button>
      </div>

      <p v-if="!filtering && starred.length === 0" class="flex items-center gap-2 px-1 text-sm text-muted-foreground">
        <Star class="size-4 shrink-0" aria-hidden="true" />Toque na estrela de uma ferramenta para ela aparecer primeiro.
      </p>
      <p v-if="filtering && found.length > 0" class="px-1 text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {{ found.length === 1 ? '1 ferramenta encontrada' : `${found.length} ferramentas encontradas` }}
      </p>
    </div>

    <EmptyState v-if="found.length === 0" :icon="SearchX" description="Nenhuma ferramenta encontrada. Tente outra palavra.">
      <button type="button" class="text-sm font-medium underline underline-offset-4" @click="clearSearch">Limpar busca</button>
    </EmptyState>

    <ul v-else-if="filtering" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Ferramentas encontradas">
      <li v-for="tool in results" :key="tool.id" class="flex"><ToolCard :tool="tool" class="w-full" /></li>
    </ul>

    <template v-else>
      <section v-if="starred.length > 0" class="space-y-4" aria-labelledby="favorites-title">
        <h2 id="favorites-title" class="flex items-center gap-2 text-xl"><Star class="size-5 fill-current" aria-hidden="true" />Suas favoritas</h2>
        <ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="tool in starred" :key="tool.id" class="flex"><ToolCard :tool="tool" class="w-full" /></li>
        </ul>
      </section>
      <template v-if="grouped">
        <section v-for="group in groups" :key="group.key" :data-tool="group.key" class="space-y-4" :aria-labelledby="`group-${group.key}`">
          <h2 :id="`group-${group.key}`" class="flex items-center gap-2.5 text-xl">
            <span class="size-3 rounded-[3px] bg-tool" aria-hidden="true" />
            {{ group.name }}
            <span class="text-base font-normal text-muted-foreground tabular-nums">{{ group.tools.length }}</span>
          </h2>
          <ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="tool in group.tools" :key="tool.id" class="flex"><ToolCard :tool="tool" class="w-full" /></li>
          </ul>
        </section>
      </template>
      <section v-else class="space-y-4" aria-labelledby="all-title">
        <h2 v-if="starred.length > 0" id="all-title" class="text-xl">Todas as ferramentas</h2>
        <h2 v-else id="all-title" class="sr-only">Ferramentas</h2>
        <ul class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="tool in rest" :key="tool.id" class="flex"><ToolCard :tool="tool" class="w-full" /></li>
        </ul>
      </section>
    </template>
  </section>
</template>
