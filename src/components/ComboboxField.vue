<script setup lang="ts">
import { Check, ChevronsUpDown } from '@lucide/vue'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Seleção com busca (padrão do app para escolher um item de uma lista). */
withDefaults(
  defineProps<{ options: string[]; placeholder?: string; searchPlaceholder?: string; emptyText?: string; id?: string }>(),
  { placeholder: 'Escolha', searchPlaceholder: 'Buscar', emptyText: 'Nada encontrado.' },
)
const model = defineModel<string>({ default: '' })
const open = ref(false)

function pick(option: string) {
  model.value = option
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button :id="id" type="button" variant="outline" size="lg" role="combobox" :aria-expanded="open" class="w-full justify-between bg-card px-3 font-normal">
        <span class="truncate" :class="model ? '' : 'text-muted-foreground'">{{ model || placeholder }}</span>
        <ChevronsUpDown class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-(--reka-popover-trigger-width) p-0" align="start">
      <Command>
        <CommandInput :placeholder="searchPlaceholder" />
        <CommandList>
          <CommandEmpty>{{ emptyText }}</CommandEmpty>
          <CommandGroup>
            <CommandItem v-for="option in options" :key="option" :value="option" class="min-h-11" @select="pick(option)">
              <span class="truncate">{{ option }}</span>
              <Check v-if="model === option" class="ml-auto size-4 text-primary" aria-hidden="true" />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
