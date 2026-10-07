<script setup lang="ts">
import { computed } from 'vue'
import { PinInput, PinInputGroup, PinInputSlot } from '@/components/ui/pin-input'

const props = withDefaults(defineProps<{ modelValue: string; id?: string; length?: number; label?: string; centered?: boolean; large?: boolean }>(), {
  length: 4,
  label: 'PIN',
})
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

/** O PIN fica como texto no estado da tela; o componente de slots trabalha com uma lista de dígitos. */
const digits = computed(() => props.modelValue.split(''))

function onUpdate(value: (string | number)[]) {
  emit('update:modelValue', value.join('').replace(/\D/g, ''))
}
</script>

<template>
  <PinInput :id="id" :model-value="digits" mask :class="centered ? 'justify-center' : 'justify-start'" :aria-label="label" @update:model-value="onUpdate">
    <PinInputGroup :class="large ? 'gap-3' : 'gap-1.5'">
      <PinInputSlot
        v-for="(_, index) in length"
        :key="index"
        :index="index"
        inputmode="numeric"
        autocomplete="off"
        :class="large ? 'size-14 rounded-2xl border text-2xl first:rounded-l-2xl last:rounded-r-2xl' : 'size-11 rounded-lg border text-lg first:rounded-l-lg last:rounded-r-lg'"
      />
    </PinInputGroup>
  </PinInput>
</template>
