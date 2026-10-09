<script setup lang="ts">
import { ArrowLeftRight, Banknote, Globe, RefreshCw, Zap } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatMoney, parseMoney } from '@/lib/money'
import { CURRENCIES, convert, formatAmount, loadQuotes, rate, type Quotes } from './lib/currency'

/** A cotação é buscada de novo a cada minuto enquanto a tela está aberta. */
const REFRESH_MS = 60_000

const amount = ref('')
const from = ref('USD')
const to = ref('BRL')
const quotes = ref<Quotes | null>(null)
const loading = ref(true)
const error = ref('')
let timer: ReturnType<typeof setInterval> | undefined

async function refresh() {
  try {
    quotes.value = await loadQuotes()
    error.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Não foi possível buscar as cotações.'
  } finally {
    loading.value = false
  }
}
onMounted(() => {
  void refresh()
  timer = setInterval(refresh, REFRESH_MS)
})
onBeforeUnmount(() => clearInterval(timer))

function swap() {
  ;[from.value, to.value] = [to.value, from.value]
}

const value = computed(() => parseMoney(amount.value) ?? 1)
const result = computed(() => (quotes.value ? convert(quotes.value, value.value, from.value, to.value) : null))
const unitRate = computed(() => (quotes.value ? rate(quotes.value, from.value, to.value) : null))
const updatedAt = computed(() => (quotes.value ? new Date(quotes.value.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''))
const available = computed(() => CURRENCIES.filter((currency) => quotes.value?.brl[currency.code]))
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Banknote" title="Conversor de moeda" description="Converta entre moedas com a cotação do momento (AwesomeAPI), atualizada a cada minuto.">
      <FactList>
        <FactTile :icon="Banknote" label="Moedas">{{ CURRENCIES.length }} opções</FactTile>
        <FactTile :icon="Globe" label="Cotação">Ao vivo</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Quanto converter</CardTitle>
          <CardDescription>Deixe o valor em branco para ver a cotação de 1 unidade.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Field>
            <FieldLabel for="amount">Valor</FieldLabel>
            <Input id="amount" v-model="amount" v-money="from" :placeholder="formatMoney(1, from)" inputmode="numeric" autocomplete="off" class="tabular-nums" />
          </Field>
          <Field>
            <FieldLabel for="from">De</FieldLabel>
            <Select v-model="from">
              <SelectTrigger id="from" class="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="currency in available" :key="currency.code" :value="currency.code">{{ currency.code }} · {{ currency.name }}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Button type="button" variant="outline" class="w-full" @click="swap"><ArrowLeftRight aria-hidden="true" />Inverter</Button>
          <Field>
            <FieldLabel for="to">Para</FieldLabel>
            <Select v-model="to">
              <SelectTrigger id="to" class="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="currency in available" :key="currency.code" :value="currency.code">{{ currency.code }} · {{ currency.name }}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <div class="space-y-4" aria-live="polite">
        <CardSkeleton v-if="loading" :lines="1" :rows="2" />
        <template v-else-if="quotes && result !== null">
          <Card>
            <CardHeader>
              <CardDescription class="tabular-nums">{{ formatAmount(value, from) }} =</CardDescription>
              <CardTitle class="text-3xl tabular-nums">{{ formatAmount(result, to) }}</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <p v-if="unitRate !== null" class="text-sm text-muted-foreground tabular-nums">1 {{ from }} = {{ unitRate.toLocaleString('pt-BR', { maximumFractionDigits: 6 }) }} {{ to }}</p>
              <CopyField :value="result.toLocaleString('pt-BR', { maximumFractionDigits: to === 'BTC' ? 8 : 2, minimumFractionDigits: to === 'BTC' ? 0 : 2 })" label="Resultado" message="Valor copiado." />
              <p class="flex items-center gap-2 text-xs text-muted-foreground tabular-nums"><RefreshCw class="size-3.5" aria-hidden="true" />Cotação das {{ updatedAt }}</p>
            </CardContent>
          </Card>
          <Alert v-if="error" variant="destructive">
            <AlertDescription>{{ error }} Mostrando a última cotação.</AlertDescription>
          </Alert>
        </template>
        <Alert v-else-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
        <EmptyState v-else :icon="Banknote" description="Escolha as moedas para ver o resultado." />
      </div>
    </div>
  </section>
</template>
