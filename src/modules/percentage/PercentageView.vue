<script setup lang="ts">
import { Calculator, Percent, PiggyBank, Tag, TrendingUp, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseMoney } from '@/lib/money'
import { applyDiscount, applyIncrease, compoundInterest, formatBrl, formatNumber, formatPercent, parseDecimal, percentChange, percentOf, simpleInterest, whatPercent } from './lib/percentage'

const tab = ref('percent')

// Porcentagem: três perguntas
const a1 = ref('')
const b1 = ref('')
const a2 = ref('')
const b2 = ref('')
const a3 = ref('')
const b3 = ref('')
const ofValue = computed(() => {
  const percent = parseDecimal(a1.value)
  const value = parseDecimal(b1.value)
  return percent === null || value === null ? null : formatNumber(percentOf(percent, value))
})
const whatValue = computed(() => {
  const part = parseDecimal(a2.value)
  const total = parseDecimal(b2.value)
  if (part === null || total === null) return null
  const percent = whatPercent(part, total)
  return percent === null ? null : formatPercent(percent)
})
const whatTotal = computed(() => {
  const part = parseDecimal(a3.value)
  const percent = parseDecimal(b3.value)
  return part === null || percent === null || percent === 0 ? null : formatNumber((part * 100) / percent)
})

// Desconto e acréscimo
const price = ref('')
const rate = ref('')
const discount = computed(() => {
  const value = parseMoney(price.value)
  const percent = parseDecimal(rate.value)
  if (value === null || percent === null) return null
  return { off: applyDiscount(value, percent), on: applyIncrease(value, percent) }
})

// Variação
const from = ref('')
const to = ref('')
const change = computed(() => {
  const start = parseDecimal(from.value)
  const end = parseDecimal(to.value)
  if (start === null || end === null) return null
  const percent = percentChange(start, end)
  return percent === null ? null : { percent, up: percent > 0, down: percent < 0 }
})

// Juros
const principal = ref('')
const interestRate = ref('')
const periods = ref('')
const interest = computed(() => {
  const value = parseMoney(principal.value)
  const percent = parseDecimal(interestRate.value)
  const count = parseDecimal(periods.value)
  if (value === null || percent === null || count === null || count < 0 || count > 1200) return null
  return { simple: simpleInterest(value, percent, count), compound: compoundInterest(value, percent, count) }
})
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Percent" title="Calculadora de porcentagem" description="Calcule porcentagens, descontos, variações e juros sem abrir a planilha.">
      <FactList>
        <FactTile :icon="Calculator" label="Contas">4 tipos</FactTile>
        <FactTile :icon="PiggyBank" label="Juros">Simples e compostos</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Que conta fazer</CardTitle>
        <CardDescription>Use vírgula para os centavos (12,5). O resultado muda enquanto você digita.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs v-model="tab">
          <TabsList class="grid w-full grid-cols-4">
            <TabsTrigger value="percent">%</TabsTrigger>
            <TabsTrigger value="discount">Desconto</TabsTrigger>
            <TabsTrigger value="change">Variação</TabsTrigger>
            <TabsTrigger value="interest">Juros</TabsTrigger>
          </TabsList>

          <TabsContent value="percent" class="mt-5 space-y-6">
            <div class="space-y-3">
              <h3 class="text-base font-semibold">Quanto é X% de Y?</h3>
              <div class="grid gap-3 sm:grid-cols-2">
                <Field><FieldLabel for="a1">Porcentagem</FieldLabel><Input id="a1" v-model="a1" inputmode="decimal" autocomplete="off" placeholder="15" class="tabular-nums" /></Field>
                <Field><FieldLabel for="b1">Valor</FieldLabel><Input id="b1" v-model="b1" inputmode="decimal" autocomplete="off" placeholder="200" class="tabular-nums" /></Field>
              </div>
              <p v-if="ofValue" role="status" class="text-2xl font-semibold tabular-nums">{{ ofValue }}</p>
            </div>
            <div class="space-y-3 border-t pt-6">
              <h3 class="text-base font-semibold">X é quantos % de Y?</h3>
              <div class="grid gap-3 sm:grid-cols-2">
                <Field><FieldLabel for="a2">Parte (X)</FieldLabel><Input id="a2" v-model="a2" inputmode="decimal" autocomplete="off" placeholder="30" class="tabular-nums" /></Field>
                <Field><FieldLabel for="b2">Total (Y)</FieldLabel><Input id="b2" v-model="b2" inputmode="decimal" autocomplete="off" placeholder="200" class="tabular-nums" /></Field>
              </div>
              <p v-if="whatValue" role="status" class="text-2xl font-semibold tabular-nums">{{ whatValue }}</p>
            </div>
            <div class="space-y-3 border-t pt-6">
              <h3 class="text-base font-semibold">X é Y% de quanto?</h3>
              <div class="grid gap-3 sm:grid-cols-2">
                <Field><FieldLabel for="a3">Valor (X)</FieldLabel><Input id="a3" v-model="a3" inputmode="decimal" autocomplete="off" placeholder="30" class="tabular-nums" /></Field>
                <Field><FieldLabel for="b3">Porcentagem (Y)</FieldLabel><Input id="b3" v-model="b3" inputmode="decimal" autocomplete="off" placeholder="15" class="tabular-nums" /></Field>
              </div>
              <p v-if="whatTotal" role="status" class="text-2xl font-semibold tabular-nums">{{ whatTotal }}</p>
            </div>
          </TabsContent>

          <TabsContent value="discount" class="mt-5 space-y-5">
            <div class="grid gap-3 sm:grid-cols-2">
              <Field><FieldLabel for="price">Preço</FieldLabel><Input id="price" v-model="price" v-money placeholder="R$ 80,00" inputmode="numeric" autocomplete="off" class="tabular-nums" /></Field>
              <Field><FieldLabel for="rate">Porcentagem</FieldLabel><Input id="rate" v-model="rate" inputmode="decimal" autocomplete="off" placeholder="25" class="tabular-nums" /></Field>
            </div>
            <div v-if="discount" role="status" class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border bg-card p-4">
                <p class="flex items-center gap-1.5 text-xs text-muted-foreground"><Tag class="size-3.5" aria-hidden="true" />Com desconto</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums">{{ formatBrl(discount.off.final) }}</p>
                <p class="text-sm text-muted-foreground tabular-nums">Economia de {{ formatBrl(discount.off.difference) }}</p>
              </div>
              <div class="rounded-xl border bg-card p-4">
                <p class="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp class="size-3.5" aria-hidden="true" />Com acréscimo</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums">{{ formatBrl(discount.on.final) }}</p>
                <p class="text-sm text-muted-foreground tabular-nums">Soma de {{ formatBrl(discount.on.difference) }}</p>
              </div>
            </div>
            <EmptyState v-else :icon="Tag" description="Informe o preço e a porcentagem." />
          </TabsContent>

          <TabsContent value="change" class="mt-5 space-y-5">
            <div class="grid gap-3 sm:grid-cols-2">
              <Field><FieldLabel for="from">Valor inicial</FieldLabel><Input id="from" v-model="from" inputmode="decimal" autocomplete="off" placeholder="100" class="tabular-nums" /></Field>
              <Field><FieldLabel for="to">Valor final</FieldLabel><Input id="to" v-model="to" inputmode="decimal" autocomplete="off" placeholder="150" class="tabular-nums" /></Field>
            </div>
            <div v-if="change" role="status" class="space-y-1">
              <p class="text-3xl font-semibold tabular-nums" :class="change.up ? 'text-success' : change.down ? 'text-destructive' : ''">{{ change.percent > 0 ? '+' : '' }}{{ formatPercent(change.percent) }}</p>
              <p class="text-muted-foreground">{{ change.up ? 'Aumento' : change.down ? 'Queda' : 'Sem variação' }} em relação ao valor inicial.</p>
            </div>
            <EmptyState v-else :icon="TrendingUp" description="Informe os dois valores (o inicial não pode ser zero)." />
          </TabsContent>

          <TabsContent value="interest" class="mt-5 space-y-5">
            <div class="grid gap-3 sm:grid-cols-3">
              <Field><FieldLabel for="principal">Valor inicial</FieldLabel><Input id="principal" v-model="principal" v-money placeholder="R$ 1.000,00" inputmode="numeric" autocomplete="off" class="tabular-nums" /></Field>
              <Field><FieldLabel for="interest-rate">Taxa por período (%)</FieldLabel><Input id="interest-rate" v-model="interestRate" inputmode="decimal" autocomplete="off" placeholder="2" class="tabular-nums" /></Field>
              <Field><FieldLabel for="periods">Períodos (meses)</FieldLabel><Input id="periods" v-model="periods" inputmode="decimal" autocomplete="off" placeholder="12" class="tabular-nums" /></Field>
            </div>
            <div v-if="interest" role="status" class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border bg-card p-4">
                <p class="text-xs text-muted-foreground">Juros simples</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums">{{ formatBrl(interest.simple.total) }}</p>
                <p class="text-sm text-muted-foreground tabular-nums">Juros de {{ formatBrl(interest.simple.interest) }}</p>
              </div>
              <div class="rounded-xl border bg-card p-4">
                <p class="text-xs text-muted-foreground">Juros compostos</p>
                <p class="mt-1 text-2xl font-semibold tabular-nums">{{ formatBrl(interest.compound.total) }}</p>
                <p class="text-sm text-muted-foreground tabular-nums">Juros de {{ formatBrl(interest.compound.interest) }}</p>
              </div>
            </div>
            <EmptyState v-else :icon="PiggyBank" description="Informe o valor, a taxa e os períodos (até 1.200)." />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </section>
</template>
