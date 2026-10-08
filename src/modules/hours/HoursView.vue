<script setup lang="ts">
import { Clock, DoorOpen, Hourglass, Plus, Sigma, Timer, Trash2, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import TimeField from '@/components/TimeField.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { between, exitTime, formatSpan, parseClock, parseSpan, sumEntries, toDecimalHours } from './lib/hours'

const tab = ref('between')

// Entre dois horários
const start = ref('08:00')
const end = ref('17:00')
const lunch = ref('1:00')
const worked = computed(() => {
  const from = parseClock(start.value)
  const to = parseClock(end.value)
  const pause = lunch.value ? parseSpan(lunch.value) : 0
  if (from === null || to === null || pause === null) return null
  return between(from, to, pause)
})

// Somar e subtrair
interface Line {
  id: number
  sign: 1 | -1
  text: string
}
let nextId = 3
const lines = ref<Line[]>([
  { id: 1, sign: 1, text: '8:00' },
  { id: 2, sign: 1, text: '7:30' },
])
const total = computed(() => {
  const entries = lines.value.flatMap((line) => {
    const minutes = parseSpan(line.text)
    return minutes === null ? [] : [{ sign: line.sign, minutes }]
  })
  return entries.length ? sumEntries(entries) : null
})
const addLine = () => lines.value.push({ id: nextId++, sign: 1, text: '' })
const removeLine = (id: number) => (lines.value = lines.value.filter((line) => line.id !== id))
const setSign = (line: Line, value: unknown) => {
  if (value === '1' || value === '-1') line.sign = Number(value) as 1 | -1
}

// Hora de saída
const entry = ref('08:00')
const workday = ref('8:00')
const exitLunch = ref('1:00')
const leave = computed(() => {
  const from = parseClock(entry.value)
  const work = parseSpan(workday.value)
  const pause = exitLunch.value ? parseSpan(exitLunch.value) : 0
  if (from === null || work === null || pause === null) return null
  return exitTime(from, work, pause)
})

const decimal = (minutes: number) => `${toDecimalHours(minutes).toLocaleString('pt-BR')} h`
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Clock" title="Calculadora de horas" description="Calcule as horas trabalhadas entre dois horários, some e subtraia durações e descubra a hora de ir embora.">
      <FactList>
        <FactTile :icon="Hourglass" label="Contas">3 tipos</FactTile>
        <FactTile :icon="Timer" label="Formato">h:mm</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Que conta fazer</CardTitle>
        <CardDescription>Digite só os números: 0830 vira 08:30. Durações podem passar de 24 horas (120:30).</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs v-model="tab">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="between">Entre horários</TabsTrigger>
            <TabsTrigger value="sum">Somar</TabsTrigger>
            <TabsTrigger value="exit">Hora de saída</TabsTrigger>
          </TabsList>

          <TabsContent value="between" class="mt-5 space-y-5">
            <div class="grid gap-4 sm:grid-cols-3">
              <Field><FieldLabel for="start">Entrada</FieldLabel><TimeField id="start" v-model="start" /></Field>
              <Field><FieldLabel for="end">Saída</FieldLabel><TimeField id="end" v-model="end" /></Field>
              <Field><FieldLabel for="lunch">Intervalo</FieldLabel><TimeField id="lunch" v-model="lunch" span /></Field>
            </div>
            <div v-if="worked" role="status" class="space-y-2">
              <p class="text-sm text-muted-foreground">Horas trabalhadas</p>
              <p class="text-4xl font-semibold tabular-nums">{{ formatSpan(worked.minutes) }}</p>
              <div class="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" class="tabular-nums">{{ decimal(worked.minutes) }}</Badge>
                <Badge v-if="worked.nextDay" variant="info">Virou a meia-noite</Badge>
                <Badge v-if="worked.minutes < 0" variant="danger">O intervalo é maior que o período</Badge>
              </div>
            </div>
            <EmptyState v-else :icon="Clock" description="Informe a entrada e a saída (e o intervalo, se houver)." />
          </TabsContent>

          <TabsContent value="sum" class="mt-5 space-y-5">
            <ul class="space-y-3">
              <li v-for="(line, index) in lines" :key="line.id" class="flex items-end gap-2">
                <Field class="flex-1">
                  <FieldLabel :for="`line-${line.id}`">Duração {{ index + 1 }}</FieldLabel>
                  <TimeField :id="`line-${line.id}`" v-model="line.text" span />
                </Field>
                <ToggleGroup type="single" variant="outline" :model-value="String(line.sign)" aria-label="Somar ou subtrair" class="bg-card" @update:model-value="setSign(line, $event)">
                  <ToggleGroupItem value="1" aria-label="Somar" class="w-11 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">+</ToggleGroupItem>
                  <ToggleGroupItem value="-1" aria-label="Subtrair" class="w-11 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">−</ToggleGroupItem>
                </ToggleGroup>
                <Button type="button" variant="ghost" size="icon" :disabled="lines.length <= 1" :aria-label="`Remover duração ${index + 1}`" @click="removeLine(line.id)"><Trash2 aria-hidden="true" /></Button>
              </li>
            </ul>
            <Button type="button" variant="outline" @click="addLine"><Plus aria-hidden="true" />Adicionar duração</Button>
            <div v-if="total !== null" role="status" class="space-y-2">
              <p class="flex items-center gap-1.5 text-sm text-muted-foreground"><Sigma class="size-4" aria-hidden="true" />Total</p>
              <p class="text-4xl font-semibold tabular-nums">{{ formatSpan(total) }}</p>
              <Badge variant="secondary" class="tabular-nums">{{ decimal(total) }}</Badge>
            </div>
            <EmptyState v-else :icon="Sigma" description="Digite pelo menos uma duração para ver o total." />
          </TabsContent>

          <TabsContent value="exit" class="mt-5 space-y-5">
            <div class="grid gap-4 sm:grid-cols-3">
              <Field><FieldLabel for="entry">Entrada</FieldLabel><TimeField id="entry" v-model="entry" /></Field>
              <Field><FieldLabel for="workday">Jornada</FieldLabel><TimeField id="workday" v-model="workday" span /></Field>
              <Field><FieldLabel for="exit-lunch">Intervalo</FieldLabel><TimeField id="exit-lunch" v-model="exitLunch" span /></Field>
            </div>
            <div v-if="leave" role="status" class="space-y-2">
              <p class="flex items-center gap-1.5 text-sm text-muted-foreground"><DoorOpen class="size-4" aria-hidden="true" />Pode ir embora às</p>
              <p class="text-4xl font-semibold tabular-nums">{{ leave.clock }}</p>
              <Badge v-if="leave.daysLater > 0" variant="info">No dia seguinte</Badge>
            </div>
            <EmptyState v-else :icon="DoorOpen" description="Informe a entrada, a jornada e o intervalo." />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </section>
</template>
