<script setup lang="ts">
import { computed } from 'vue'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { Badge } from '@/components/ui/badge'
import { FieldError, FieldLabel } from '@/components/ui/field'
import { parseNames, validateNames } from '../lib/names'

const model = defineModel<string>({ required: true })

const parsed = computed(() => parseNames(model.value))
const count = computed(() => parsed.value.names.length)
// Lista vazia não gera aviso aqui: quem bloqueia o sorteio é o botão da tela.
const error = computed(() => (count.value === 0 ? null : validateNames(parsed.value)))
</script>

<template>
  <div class="space-y-3">
    <FieldLabel for="names" class="sr-only">Nomes (um por linha)</FieldLabel>
    <InputGroup class="bg-card">
      <InputGroupTextarea
        id="names"
        v-model="model"
        rows="12"
        placeholder="Ana&#10;Bruno&#10;Carla"
        class="min-h-72 text-base"
        :aria-invalid="error ? true : undefined"
      />
      <InputGroupAddon align="block-end" class="border-t">
        <Badge variant="secondary">{{ count }} {{ count === 1 ? 'nome' : 'nomes' }}</Badge>
      </InputGroupAddon>
    </InputGroup>
    <FieldError v-if="error">{{ error }}</FieldError>
    <p v-if="parsed.duplicates.length > 0" class="text-sm text-warning">
      Nomes duplicados (cada um conta como uma chance): {{ parsed.duplicates.join(', ') }}.
    </p>
  </div>
</template>
