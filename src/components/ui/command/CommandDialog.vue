<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from "reka-ui"
import { useForwardPropsEmits } from "reka-ui"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Command from "./Command.vue"

const props = withDefaults(defineProps<DialogRootProps & {
  title?: string
  description?: string
}>(), {
  title: "Command Palette",
  description: "Search for a command to run...",
})
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <!--
    Ancorada no alto (e não no meio) para a lista não pular quando o filtro encolhe nem ficar sob o teclado do celular.
    O botão de fechar fica na linha da busca (slot `end` do CommandInput), não no canto da caixa.
  -->
  <Dialog v-slot="slotProps" v-bind="forwarded">
    <DialogContent :show-close-button="false" class="top-3 translate-y-0 gap-0 overflow-hidden rounded-xl p-0 sm:top-[12vh] sm:max-w-xl">
      <DialogHeader class="sr-only">
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <Command>
        <slot v-bind="slotProps" />
      </Command>
    </DialogContent>
  </Dialog>
</template>
