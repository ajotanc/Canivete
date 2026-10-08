<script setup lang="ts">
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from '@/components/ui/number-field'
import { cn } from '@/lib/utils'

/**
 * Campo de número padrão do app: botões de menos e mais ao lado do valor, com mínimo e máximo.
 * Use no lugar de um Input quando a pessoa escolhe uma quantidade inteira pequena (vencedores, minutos…).
 */
const model = defineModel<number>({ required: true })
withDefaults(defineProps<{ id?: string; min?: number; max?: number; step?: number; disabled?: boolean; class?: string }>(), { step: 1 })
</script>

<template>
  <NumberField :id="id" v-model="model" :min="min" :max="max" :step="step" :disabled="disabled" :class="cn('w-32', $props.class)">
    <NumberFieldContent>
      <NumberFieldDecrement />
      <NumberFieldInput class="h-11 tabular-nums" />
      <NumberFieldIncrement />
    </NumberFieldContent>
  </NumberField>
</template>
