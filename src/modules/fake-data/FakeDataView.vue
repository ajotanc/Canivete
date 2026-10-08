<script setup lang="ts">
import { Braces, RefreshCw, ShieldCheck, UsersRound, Zap } from '@lucide/vue'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import CopyRows from '@/components/CopyRows.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FIELD_LABELS, generatePerson, peopleToJson, type Person } from './lib/person'

const QUANTITIES = [1, 5, 10] as const

const quantity = ref<number>(QUANTITIES[0])
const people = ref<Person[]>([])

function generate() {
  people.value = Array.from({ length: quantity.value }, () => generatePerson())
}
watch(quantity, generate, { immediate: true, flush: 'sync' })

function onQuantity(value: unknown) {
  const amount = Number(value)
  if ((QUANTITIES as readonly number[]).includes(amount)) quantity.value = amount
}

async function copy(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(message)
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="UsersRound" title="Dados fictícios" description="Gere pessoas de mentira, com CPF válido, e-mail, telefone e endereço, para testar sistemas e formulários.">
      <FactList>
        <FactTile :icon="ShieldCheck" label="CPF">Válido</FactTile>
        <FactTile :icon="Braces" label="Exporta">Em JSON</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Quantas pessoas</CardTitle>
          <CardDescription>Ao trocar a quantidade, as pessoas já são geradas de novo.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel for="quantity">Quantidade</FieldLabel>
              <FieldDescription>Quantas de uma vez.</FieldDescription>
            </FieldContent>
            <ToggleGroup id="quantity" type="single" variant="outline" :model-value="String(quantity)" aria-label="Quantidade" class="bg-card" @update:model-value="onQuantity">
              <ToggleGroupItem v-for="amount in QUANTITIES" :key="amount" :value="String(amount)" class="min-w-11 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{{ amount }}</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Button size="lg" class="w-full" @click="generate">
            <RefreshCw aria-hidden="true" />
            {{ quantity === 1 ? 'Gerar outra' : 'Gerar outras' }}
          </Button>
          <Button variant="outline" size="lg" class="w-full" @click="copy(peopleToJson(people), 'JSON copiado.')">
            <Braces aria-hidden="true" />
            Copiar tudo em JSON
          </Button>
          <p class="text-sm text-muted-foreground">O CPF passa na conta dos dígitos verificadores, mas não pertence a ninguém. O e-mail usa example.com e o CEP é sorteado. Use só para testes.</p>
        </CardContent>
      </Card>

      <div class="space-y-4">
        <p class="sr-only" role="status">{{ people.length }} {{ people.length === 1 ? 'pessoa gerada' : 'pessoas geradas' }}.</p>
        <Card v-for="(person, index) in people" :key="`${index}-${person.cpf}`">
          <CardHeader>
            <CardTitle class="text-lg">{{ person.name }}</CardTitle>
            <CardDescription class="tabular-nums">{{ person.city }} - {{ person.state }}</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" @click="copy(peopleToJson([person]), 'Pessoa copiada em JSON.')">
                <Braces aria-hidden="true" />
                JSON
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <CopyRows :rows="FIELD_LABELS.map((field) => ({ label: field.label, value: person[field.key] }))" />
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>
