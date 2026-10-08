<script setup lang="ts">
import { Input } from '@/components/ui/input'

/**
 * Campo de hora padrão do app, com máscara: "08:30" para um horário do dia, ou, com `span`, uma duração que pode passar de 24 horas ("120:30").
 * O valor é o texto com a máscara; use `parseClock` ou `parseSpan` (módulo de horas) para ler os minutos.
 */
const model = defineModel<string>({ default: '' })
defineProps<{ id?: string; span?: boolean; disabled?: boolean }>()

const SPAN_MASK = "['#:##', '##:##', '###:##']"
</script>

<template>
  <Input :id="id" v-model="model" v-maska :data-maska="span ? SPAN_MASK : '##:##'" type="text" inputmode="numeric" autocomplete="off" :placeholder="span ? '0:00' : '00:00'" :disabled="disabled" class="tabular-nums" />
</template>
