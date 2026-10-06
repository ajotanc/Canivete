<script setup lang="ts">
import { X } from '@lucide/vue'
import { ref } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    placeholder?: string
    maxItems?: number
    maxLength?: number
    id?: string
  }>(),
  { placeholder: 'Digite e aperte Enter', maxItems: 20, maxLength: 100 },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: string[]): void }>()

const draft = ref('')

/** Enter (ou vírgula) transforma o texto em item; repetidos e vazios são ignorados. */
function commit() {
  const item = draft.value.trim().replace(/\s+/g, ' ')
  draft.value = ''
  if (!item || props.modelValue.length >= props.maxItems) return
  if (props.modelValue.some((current) => current.toLocaleLowerCase('pt-BR') === item.toLocaleLowerCase('pt-BR'))) return
  emit('update:modelValue', [...props.modelValue, item])
}

function remove(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    commit()
  } else if (event.key === 'Backspace' && draft.value === '' && props.modelValue.length > 0) {
    remove(props.modelValue.length - 1)
  }
}
</script>

<template>
  <div class="space-y-2">
    <ul v-if="modelValue.length > 0" class="flex flex-wrap gap-2" aria-label="Itens da lista">
      <li
        v-for="(item, index) in modelValue"
        :key="item"
        class="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-sm text-primary"
      >
        <span class="truncate">{{ item }}</span>
        <button
          type="button"
          class="inline-flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring"
          :aria-label="`Remover ${item}`"
          @click="remove(index)"
        >
          <X class="size-3.5" aria-hidden="true" />
        </button>
      </li>
    </ul>
    <input
      :id="id"
      v-model="draft"
      type="text"
      autocomplete="off"
      :maxlength="maxLength"
      :placeholder="modelValue.length >= maxItems ? `Limite de ${maxItems} itens` : placeholder"
      :disabled="modelValue.length >= maxItems"
      :class="cn(
        'border-input bg-surface placeholder:text-muted-foreground h-11 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
      )"
      @keydown="onKeydown"
      @blur="commit"
    >
  </div>
</template>
