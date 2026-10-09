<script setup lang="ts">
import type { Component } from 'vue'
import { ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import { cn } from '@/lib/utils'

/**
 * Campo de arquivo padrão do app: área para tocar, clicar ou soltar o arquivo (EmptyState dentro de um rótulo).
 * Emite `select` com o arquivo escolhido; quem usa valida o tipo e o tamanho. `disabled` trava a área (ex.: enquanto envia).
 */
const props = defineProps<{ id: string; accept?: string; icon?: Component; description: string; disabled?: boolean; class?: string }>()
const emit = defineEmits<{ select: [file: File] }>()

const dragging = ref(false)

function onChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('select', file)
  // Permite escolher o mesmo arquivo de novo depois.
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  if (props.disabled) return
  const file = event.dataTransfer?.files?.[0]
  if (file) emit('select', file)
}
</script>

<template>
  <label
    :for="id"
    :class="cn('block cursor-pointer rounded-xl transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 motion-reduce:transition-none', dragging && 'bg-primary/10', disabled && 'pointer-events-none cursor-default opacity-60', props.class)"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
  >
    <EmptyState :icon="icon" :description="description" class="py-10 hover:bg-accent/50" />
    <input :id="id" type="file" :accept="accept" :disabled="disabled" class="sr-only" @change="onChange" />
  </label>
</template>
