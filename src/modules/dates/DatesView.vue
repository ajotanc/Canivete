<script setup lang="ts">
import { CalendarDays, CalendarRange, Cake, PartyPopper, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import DateField from '@/components/DateField.vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { addBusinessDays, addDays, ageOn, businessDaysBetween, daysBetween, describeSpan, formatLong, holidayName, isValidIso, spanBetween, todayIso, weekdayName } from './lib/dates'

const tab = ref('difference')
const today = todayIso()

// Diferença entre duas datas
const from = ref(today)
const to = ref('')
const difference = computed(() => {
  if (!isValidIso(from.value) || !isValidIso(to.value)) return null
  const days = daysBetween(from.value, to.value)
  return {
    days,
    absolute: Math.abs(days),
    weeks: Math.floor(Math.abs(days) / 7),
    business: businessDaysBetween(from.value, to.value),
    span: describeSpan(spanBetween(from.value, to.value)),
  }
})

// Somar ou subtrair
const base = ref(today)
const amount = ref('30')
const subtract = ref(false)
const businessOnly = ref(false)
const result = computed(() => {
  if (!isValidIso(base.value)) return null
  const value = Number.parseInt(amount.value, 10)
  if (!Number.isFinite(value) || value < 0 || value > 36_500) return null
  const signed = subtract.value ? -value : value
  const date = businessOnly.value ? addBusinessDays(base.value, signed) : addDays(base.value, signed)
  return { date, long: formatLong(date), weekday: weekdayName(date), holiday: holidayName(date) }
})

// Idade
const birth = ref('')
const age = computed(() => {
  if (!isValidIso(birth.value) || birth.value > today) return null
  return { ...ageOn(birth.value, today), totalDays: daysBetween(birth.value, today) }
})
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="CalendarDays" title="Calculadora de datas" description="Descubra quantos dias faltam, some prazos em dias corridos ou úteis e calcule uma idade exata.">
      <FactList>
        <FactTile :icon="CalendarRange" label="Dias">Corridos e úteis</FactTile>
        <FactTile :icon="PartyPopper" label="Feriados">Nacionais</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <Card>
      <CardHeader>
        <CardTitle class="text-lg">O que calcular</CardTitle>
        <CardDescription>Os dias úteis descontam fins de semana e feriados nacionais (não entram Carnaval nem feriados locais).</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs v-model="tab">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="difference">Diferença</TabsTrigger>
            <TabsTrigger value="add">Somar dias</TabsTrigger>
            <TabsTrigger value="age">Idade</TabsTrigger>
          </TabsList>

          <TabsContent value="difference" class="mt-5 space-y-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel for="from">De</FieldLabel>
                <DateField id="from" v-model="from" :past="100" :future="100" />
              </Field>
              <Field>
                <FieldLabel for="to">Até</FieldLabel>
                <DateField id="to" v-model="to" :past="100" :future="100" />
              </Field>
            </div>
            <div v-if="difference" role="status" class="space-y-3">
              <p class="text-3xl font-semibold tabular-nums">{{ difference.absolute }} {{ difference.absolute === 1 ? 'dia' : 'dias' }}</p>
              <p class="text-muted-foreground">{{ difference.span }}{{ difference.days < 0 ? ' (a segunda data é antes da primeira)' : '' }}</p>
              <dl class="grid grid-cols-2 gap-2">
                <div class="rounded-xl border bg-card p-3">
                  <dt class="text-xs text-muted-foreground">Dias úteis</dt>
                  <dd class="mt-1 font-semibold tabular-nums">{{ difference.business }}</dd>
                </div>
                <div class="rounded-xl border bg-card p-3">
                  <dt class="text-xs text-muted-foreground">Semanas inteiras</dt>
                  <dd class="mt-1 font-semibold tabular-nums">{{ difference.weeks }}</dd>
                </div>
              </dl>
            </div>
            <EmptyState v-else :icon="CalendarRange" description="Escolha as duas datas para ver a diferença." />
          </TabsContent>

          <TabsContent value="add" class="mt-5 space-y-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel for="base">Data de partida</FieldLabel>
                <DateField id="base" v-model="base" :past="100" :future="100" />
              </Field>
              <Field>
                <FieldLabel for="amount">Quantidade de dias</FieldLabel>
                <Input id="amount" v-model="amount" v-maska data-maska="#####" type="text" inputmode="numeric" class="tabular-nums" />
              </Field>
            </div>
            <div class="flex flex-wrap gap-x-8 gap-y-3">
              <label class="flex items-center gap-3 text-sm font-medium"><Switch v-model="subtract" />Subtrair</label>
              <label class="flex items-center gap-3 text-sm font-medium"><Switch v-model="businessOnly" />Só dias úteis</label>
            </div>
            <div v-if="result" role="status" class="space-y-1">
              <p class="text-3xl font-semibold">{{ result.long }}</p>
              <p class="text-muted-foreground">{{ result.weekday }}{{ result.holiday ? `, feriado de ${result.holiday}` : '' }}</p>
            </div>
            <EmptyState v-else :icon="CalendarRange" description="Escolha a data e a quantidade de dias (até 36.500)." />
          </TabsContent>

          <TabsContent value="age" class="mt-5 space-y-5">
            <Field class="max-w-xs">
              <FieldLabel for="birth">Data de nascimento</FieldLabel>
              <DateField id="birth" v-model="birth" :past="110" max-today />
            </Field>
            <div v-if="age" role="status" class="space-y-3">
              <p class="text-3xl font-semibold tabular-nums">{{ age.years }} {{ age.years === 1 ? 'ano' : 'anos' }}</p>
              <p class="text-muted-foreground">{{ describeSpan(age) }}, ou {{ age.totalDays.toLocaleString('pt-BR') }} dias de vida.</p>
              <p class="flex items-center gap-2 text-sm font-medium">
                <Cake class="size-4 text-primary" aria-hidden="true" />
                {{ age.daysToBirthday === 0 ? 'Hoje é aniversário!' : `Faltam ${age.daysToBirthday} ${age.daysToBirthday === 1 ? 'dia' : 'dias'} para o próximo aniversário.` }}
              </p>
            </div>
            <EmptyState v-else :icon="Cake" description="Informe a data de nascimento para ver a idade." />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </section>
</template>
