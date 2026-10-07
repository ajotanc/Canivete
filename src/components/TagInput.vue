<script setup lang="ts">
import { TagsInput, TagsInputInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText } from '@/components/ui/tags-input'

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

const sameKey = (value: string) => value.toLocaleLowerCase('pt-BR')

/** Normaliza espaços, descarta vazios e repetidos (sem diferenciar maiúsculas) e respeita o limite. */
function onUpdate(value: unknown) {
  const seen = new Set<string>()
  const next: string[] = []
  for (const raw of value as string[]) {
    const item = raw.trim().replace(/\s+/g, ' ')
    if (!item || seen.has(sameKey(item)) || next.length >= props.maxItems) continue
    seen.add(sameKey(item))
    next.push(item)
  }
  const unchanged = next.length === props.modelValue.length && next.every((item, index) => item === props.modelValue[index])
  if (!unchanged) emit('update:modelValue', next)
}
</script>

<template>
  <TagsInput
    :model-value="modelValue"
    :max="maxItems"
    add-on-blur
    delimiter=","
    class="min-h-11 gap-1.5 bg-card px-2.5 py-1.5"
    @update:model-value="onUpdate"
  >
    <TagsInputItem v-for="item in modelValue" :key="item" :value="item" class="h-7 rounded-md bg-primary/10 pl-2 text-primary">
      <TagsInputItemText class="px-0 text-sm font-medium" />
      <TagsInputItemDelete :aria-label="`Remover ${item}`" class="size-5 items-center justify-center hover:bg-primary/15" />
    </TagsInputItem>
    <TagsInputInput
      :id="id"
      :maxlength="maxLength"
      :placeholder="modelValue.length >= maxItems ? `Limite de ${maxItems} itens` : placeholder"
      :disabled="modelValue.length >= maxItems"
      class="h-7 min-w-32 text-base md:text-sm"
    />
  </TagsInput>
</template>
