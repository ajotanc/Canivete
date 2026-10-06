<script setup lang="ts">
import { computed } from 'vue'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { parseNames, validateNames } from '../lib/names'

const model = defineModel<string>({ required: true })

const parsed = computed(() => parseNames(model.value))
const count = computed(() => parsed.value.names.length)
// Lista vazia não gera aviso aqui: quem bloqueia o sorteio é o botão da tela.
const error = computed(() => (count.value === 0 ? null : validateNames(parsed.value)))
</script>

<template>
  <div class="space-y-2">
    <Label for="names">Nomes (um por linha)</Label>
    <Textarea
      id="names"
      v-model="model"
      rows="12"
      placeholder="Ana&#10;Bruno&#10;Carla"
      class="font-mono"
    />
    <div class="flex items-center justify-between text-sm text-muted-foreground">
      <span>{{ count }} {{ count === 1 ? 'nome' : 'nomes' }}</span>
    </div>
    <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
    <p v-if="parsed.duplicates.length > 0" class="text-sm text-amber-600 dark:text-amber-400">
      Nomes duplicados (cada um conta como uma chance): {{ parsed.duplicates.join(', ') }}.
    </p>
  </div>
</template>
