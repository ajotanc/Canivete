<script setup lang="ts">
import { House, Moon, Sun } from '@lucide/vue'
import { useEventListener } from '@vueuse/core'
import { useRouter } from 'vue-router'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { tools } from '@/core/modules/registry'
import { useTheme } from '@/core/theme/useTheme'

const open = defineModel<boolean>('open', { required: true })

const router = useRouter()
const { isDark, toggle } = useTheme()

/** Ctrl/⌘ + K abre de qualquer lugar; "/" abre quando a pessoa não está digitando. */
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  const typing = target?.matches('input, textarea, select, [contenteditable="true"]') ?? false
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = !open.value
  } else if (event.key === '/' && !typing && !open.value) {
    event.preventDefault()
    open.value = true
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
    <CommandInput placeholder="Buscar ferramenta ou ação" />
    <CommandList>
      <CommandEmpty>Nada encontrado. Tente outra palavra.</CommandEmpty>
      <CommandGroup heading="Ferramentas">
        <CommandItem v-for="tool in tools" :key="tool.id" :value="`${tool.title} ${tool.description} ${tool.category}`" @select="go(`/${tool.id}`)">
          <span data-slot="tool-dot" :data-tool="tool.color ?? 'cobalt'" class="flex size-7 items-center justify-center rounded-chip bg-tool">
            <component :is="tool.icon" class="size-4 text-tool-foreground" aria-hidden="true" />
          </span>
          <span>{{ tool.title }}</span>
          <CommandShortcut>{{ tool.category }}</CommandShortcut>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Ações">
        <CommandItem value="início home página inicial" @select="go('/')">
          <House class="text-foreground" aria-hidden="true" />
          Ir para o início
        </CommandItem>
        <CommandItem :value="isDark ? 'tema claro' : 'tema escuro'" @select="switchTheme">
          <Sun v-if="isDark" class="text-foreground" aria-hidden="true" />
          <Moon v-else class="text-foreground" aria-hidden="true" />
          {{ isDark ? 'Usar tema claro' : 'Usar tema escuro' }}
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
