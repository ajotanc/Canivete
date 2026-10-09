<script setup lang="ts">
import type { ListboxFilterProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { Search, X } from "@lucide/vue"
import { reactiveOmit } from "@vueuse/core"
import { ListboxFilter, useForwardProps } from "reka-ui"
import { ref } from "vue"
import { cn } from "@/lib/utils"
import { useCommand } from "."

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<ListboxFilterProps & {
  class?: HTMLAttributes["class"]
}>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)

const { filterState } = useCommand()

const filter = ref<InstanceType<typeof ListboxFilter>>()
function clear() {
  filterState.search = ""
  ;(filter.value?.$el as HTMLInputElement | undefined)?.focus()
}
</script>

<template>
  <!-- Linha de busca: lupa, campo, "limpar" quando há texto e o slot `end` (ex.: o botão de fechar da paleta). -->
  <div
    data-slot="command-input-wrapper"
    class="flex h-14 items-center gap-1 border-b pr-2 pl-4"
  >
    <Search class="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    <ListboxFilter
      ref="filter"
      v-bind="{ ...forwardedProps, ...$attrs }"
      v-model="filterState.search"
      data-slot="command-input"
      auto-focus
      :class="cn('placeholder:text-muted-foreground flex h-11 w-full min-w-0 bg-transparent px-2 text-base outline-hidden disabled:cursor-not-allowed disabled:opacity-50', props.class)"
    />
    <button
      v-if="filterState.search"
      type="button"
      class="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-hidden"
      aria-label="Limpar busca"
      @click="clear"
    >
      <span class="flex size-6 items-center justify-center rounded-full bg-muted"><X class="size-3.5" aria-hidden="true" /></span>
    </button>
    <slot name="end" />
  </div>
</template>
