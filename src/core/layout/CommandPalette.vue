<script setup lang="ts">
import { FileText, House, Moon, SearchX, ShieldCheck, Star, Sun } from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import { DialogClose } from 'reka-ui'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'
import { favorites } from '@/core/home/favorites'
import { toolColor } from '@/core/modules/categories'
import { tools } from '@/core/modules/registry'
import { useTheme } from '@/core/theme/useTheme'

const open = defineModel<boolean>('open', { required: true })

const router = useRouter()
const groups = computed(() => [
  { heading: 'Favoritas', items: tools.filter((tool) => favorites.value.includes(tool.id)) },
  { heading: 'Ferramentas', items: tools.filter((tool) => !favorites.value.includes(tool.id)) },
].filter((group) => group.items.length > 0))
const { isDark, toggle } = useTheme()

/**
 * Ctrl/⌘ + K abre de qualquer lugar; "/" abre quando a pessoa não está digitando.
 * Na home, "/" leva ao campo de busca da própria página (`data-home-search`), que mostra esse atalho.
 */
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  const typing = target?.matches('input, textarea, select, [contenteditable="true"]') ?? false
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = !open.value
  } else if (event.key === '/' && !typing && !open.value) {
    event.preventDefault()
    const homeSearch = document.querySelector<HTMLInputElement>('[data-home-search]')
    if (homeSearch) homeSearch.focus()
    else open.value = true
  }
})

function go(path: string) {
  open.value = false
  router.push(path)
}

function switchTheme() {
  open.value = false
  toggle()
}
</script>

<template>
  <CommandDialog v-model:open="open" title="Buscar" description="Abra uma ferramenta ou mude o tema.">
    <CommandInput placeholder="Buscar ferramenta ou ação">
      <template #end>
        <DialogClose
          class="flex h-11 shrink-0 items-center rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-hidden"
          aria-label="Fechar busca"
        >
          <Kbd class="max-sm:hidden">Esc</Kbd>
          <span class="sm:hidden">Fechar</span>
        </DialogClose>
      </template>
    </CommandInput>
    <CommandList class="max-h-[min(60dvh,26rem)] p-1">
      <CommandEmpty class="p-3">
        <EmptyState :icon="SearchX" description="Nada encontrado. Tente outra palavra." />
      </CommandEmpty>
      <CommandGroup v-for="group in groups" :key="group.heading" :heading="group.heading">
        <CommandItem v-for="tool in group.items" :key="tool.id" :value="tool.id" class="gap-3 rounded-lg px-2 py-2" @select="go(`/${tool.id}`)">
          <span data-slot="tool-dot" :data-tool="toolColor(tool)" class="flex size-9 shrink-0 items-center justify-center rounded-chip border border-tool/20 bg-tool">
            <component :is="tool.icon" class="size-4.5 text-tool-foreground" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-1.5 truncate font-medium text-foreground">{{ tool.title }}<Star v-if="group.heading === 'Favoritas'" class="size-3.5 shrink-0 fill-current text-muted-foreground" aria-label="favorita" /></span>
            <span class="block truncate text-xs text-muted-foreground">{{ tool.description }}</span>
          </span>
          <span class="shrink-0 text-xs text-muted-foreground max-sm:hidden">{{ tool.category }}</span>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Ações">
        <CommandItem value="home" class="gap-3 rounded-lg px-2 py-2" @select="go('/')">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-chip border bg-muted"><House class="size-4.5 text-foreground" aria-hidden="true" /></span>
          <span class="font-medium">Ir para o início</span>
        </CommandItem>
        <CommandItem value="theme" class="gap-3 rounded-lg px-2 py-2" @select="switchTheme">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-chip border bg-muted">
            <Sun v-if="isDark" class="size-4.5 text-foreground" aria-hidden="true" />
            <Moon v-else class="size-4.5 text-foreground" aria-hidden="true" />
          </span>
          <span class="font-medium">{{ isDark ? 'Usar tema claro' : 'Usar tema escuro' }}</span>
          <span class="sr-only">tema claro escuro</span>
        </CommandItem>
        <CommandItem value="privacy" class="gap-3 rounded-lg px-2 py-2" @select="go('/privacy')">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-chip border bg-muted"><ShieldCheck class="size-4.5 text-foreground" aria-hidden="true" /></span>
          <span class="font-medium">Política de privacidade</span>
          <span class="sr-only">cookies dados lgpd</span>
        </CommandItem>
        <CommandItem value="terms" class="gap-3 rounded-lg px-2 py-2" @select="go('/terms')">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-chip border bg-muted"><FileText class="size-4.5 text-foreground" aria-hidden="true" /></span>
          <span class="font-medium">Termos de uso</span>
        </CommandItem>
      </CommandGroup>
    </CommandList>
    <div class="flex items-center gap-4 border-t px-4 py-2.5 text-xs text-muted-foreground max-sm:hidden" aria-hidden="true">
      <span class="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd>navegar</span>
      <span class="flex items-center gap-1.5"><Kbd>Enter</Kbd>abrir</span>
      <span class="ml-auto flex items-center gap-1.5"><Kbd>Ctrl</Kbd><Kbd>K</Kbd>abre de qualquer tela</span>
    </div>
  </CommandDialog>
</template>
