<script setup lang="ts">
import { MapPin, MapPinOff, Search, Zap, Navigation, Globe } from '@lucide/vue'
import { computed, ref } from 'vue'
import CopyField from '@/components/CopyField.vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import CardSkeleton from '@/components/skeletons/CardSkeleton.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { addressLine, cepDigits, lookupCep, searchStreet, type Address } from './lib/cep'

type Mode = 'cep' | 'street'

const mode = ref<Mode>('cep')
const cepText = ref('')
const state = ref('')
const city = ref('')
const street = ref('')

const loading = ref(false)
const error = ref('')
/** `null` antes da primeira consulta. */
const results = ref<Address[] | null>(null)

const canSearch = computed(() => (mode.value === 'cep' ? cepDigits(cepText.value).length === 8 : state.value.length === 2 && city.value.trim().length >= 3 && street.value.trim().length >= 3))

async function search() {
  if (!canSearch.value || loading.value) return
  loading.value = true
  error.value = ''
  results.value = null
  try {
    if (mode.value === 'cep') {
      const address = await lookupCep(cepDigits(cepText.value))
      results.value = address ? [address] : []
    } else {
      results.value = await searchStreet(state.value, city.value, street.value)
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'A consulta falhou. Tente de novo em instantes.'
  } finally {
    loading.value = false
  }
}

function onMode(value: unknown) {
  if (value !== 'cep' && value !== 'street') return
  mode.value = value
  results.value = null
  error.value = ''
}

const fields = (address: Address) =>
  [
    { label: 'CEP', value: address.cep },
    { label: 'Rua', value: address.street },
    { label: 'Complemento', value: address.complement },
    { label: 'Bairro', value: address.neighborhood },
    { label: 'Cidade', value: address.city },
    { label: 'Estado', value: address.state },
    { label: 'Código IBGE', value: address.ibge },
    { label: 'DDD', value: address.ddd },
  ].filter((field) => field.value)
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="MapPin" title="Consulta de CEP" description="Descubra o endereço de um CEP, ou o CEP de uma rua, com dados dos Correios.">
      <FactList>
        <FactTile :icon="Navigation" label="Busca">CEP ou rua</FactTile>
        <FactTile :icon="Globe" label="Fonte">ViaCEP</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">O que procurar</CardTitle>
          <CardDescription>O CEP digitado é enviado ao ViaCEP para a consulta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-4" @submit.prevent="search">
            <Tabs :model-value="mode" @update:model-value="onMode">
              <TabsList class="grid w-full grid-cols-2">
                <TabsTrigger value="cep">Tenho o CEP</TabsTrigger>
                <TabsTrigger value="street">Tenho a rua</TabsTrigger>
              </TabsList>
            </Tabs>

            <Field v-if="mode === 'cep'">
              <FieldLabel for="cep">CEP</FieldLabel>
              <Input id="cep" v-model="cepText" v-maska data-maska="#####-###" type="text" inputmode="numeric" autocomplete="postal-code" placeholder="01310-100" class="tabular-nums" />
            </Field>
            <template v-else>
              <Field>
                <FieldLabel for="state">Estado (sigla)</FieldLabel>
                <Input id="state" v-model="state" v-maska data-maska="AA" data-maska-tokens="A:[A-Za-z]" autocapitalize="characters" autocomplete="address-level1" placeholder="SP" />
              </Field>
              <Field>
                <FieldLabel for="city">Cidade</FieldLabel>
                <Input id="city" v-model="city" autocomplete="address-level2" placeholder="São Paulo" />
              </Field>
              <Field>
                <FieldLabel for="street">Rua</FieldLabel>
                <Input id="street" v-model="street" autocomplete="street-address" placeholder="Avenida Paulista" />
              </Field>
            </template>

            <Button type="submit" size="lg" class="w-full" :disabled="!canSearch || loading">
              <Search aria-hidden="true" />
              Consultar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div class="space-y-4" aria-live="polite">
        <CardSkeleton v-if="loading" :lines="1" :rows="3" />
        <Alert v-else-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
        <EmptyState v-else-if="results === null" :icon="MapPin" description="O endereço aparece aqui depois da consulta." class="py-12" />
        <EmptyState v-else-if="results.length === 0" :icon="MapPinOff" description="Nada encontrado. Confira o CEP ou o nome da rua e tente de novo." class="py-12" />
        <template v-else>
          <Card v-for="address in results" :key="address.cep + address.street">
            <CardHeader>
              <CardTitle class="text-lg">{{ address.street || address.city }}</CardTitle>
              <CardDescription>{{ address.neighborhood ? `${address.neighborhood}, ` : '' }}{{ address.city }} - {{ address.state }}</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <div v-for="field in fields(address)" :key="field.label">
                  <dt class="text-xs text-muted-foreground">{{ field.label }}</dt>
                  <dd class="font-medium tabular-nums">{{ field.value }}</dd>
                </div>
              </dl>
              <CopyField :value="addressLine(address)" label="Endereço" message="Endereço copiado." />
            </CardContent>
          </Card>
        </template>
      </div>
    </div>
  </section>
</template>
