<script setup lang="ts">
import { BriefcaseBusiness, CalendarOff, Clock, DoorOpen, Hourglass, Plus, Sigma, Timer, Trash2, X, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import DateField from '@/components/DateField.vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import TimeField from '@/components/TimeField.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { isoToNumeric } from '@/lib/date'
import { isValidIso, todayIso, weekdayName } from '@/modules/dates/lib/dates'
import { between, exitTime, formatSpan, parseClock, parseSpan, sumEntries, toDecimalHours, workHoursBetween } from './lib/hours'

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

// Horas úteis entre datas
const rangeFrom = ref(todayIso())
const rangeTo = ref('')
const dailyHours = ref('8:00')
const saturdayHours = ref('0:00')
const optionalDaysOff = ref(false)
const newDayOff = ref('')
const extraDaysOff = ref<string[]>([])
const addDayOff = () => {
  if (!isValidIso(newDayOff.value)) return
  if (!extraDaysOff.value.includes(newDayOff.value)) extraDaysOff.value = [...extraDaysOff.value, newDayOff.value].sort()
  newDayOff.value = ''
}
const removeDayOff = (date: string) => (extraDaysOff.value = extraDaysOff.value.filter((day) => day !== date))
const business = computed(() => {
  const weekdayMinutes = parseSpan(dailyHours.value)
  const saturdayMinutes = saturdayHours.value ? parseSpan(saturdayHours.value) : 0
  if (!isValidIso(rangeFrom.value) || !isValidIso(rangeTo.value) || weekdayMinutes === null || saturdayMinutes === null) return null
  return workHoursBetween(rangeFrom.value, rangeTo.value, { weekdayMinutes, saturdayMinutes, optionalDaysOff: optionalDaysOff.value, extraDaysOff: extraDaysOff.value })
})

const decimal = (minutes: number) => `${toDecimalHours(minutes).toLocaleString('pt-BR')} h`
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Clock" title="Calculadora de horas" description="Calcule as horas trabalhadas entre dois horários, some e subtraia durações, descubra a hora de ir embora e conte as horas úteis entre duas datas.">
      <FactList>
        <FactTile :icon="Hourglass" label="Contas">4 tipos</FactTile>
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
          <TabsList class="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="between" class="h-9">Entre horários</TabsTrigger>
            <TabsTrigger value="sum" class="h-9">Somar</TabsTrigger>
            <TabsTrigger value="exit" class="h-9">Hora de saída</TabsTrigger>
            <TabsTrigger value="business" class="h-9">Horas úteis</TabsTrigger>
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

          <TabsContent value="business" class="mt-5 space-y-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <Field><FieldLabel for="range-from">De</FieldLabel><DateField id="range-from" v-model="rangeFrom" :past="10" :future="10" /></Field>
              <Field><FieldLabel for="range-to">Até (o dia conta)</FieldLabel><DateField id="range-to" v-model="rangeTo" :past="10" :future="10" /></Field>
              <Field>
                <FieldLabel for="daily-hours">Horas por dia</FieldLabel>
                <TimeField id="daily-hours" v-model="dailyHours" span />
                <FieldDescription>De segunda a sexta, já sem o intervalo.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel for="saturday-hours">Horas no sábado</FieldLabel>
                <TimeField id="saturday-hours" v-model="saturdayHours" span />
                <FieldDescription>0:00 se não trabalha no sábado.</FieldDescription>
              </Field>
            </div>
            <label class="flex items-center gap-3 text-sm font-medium"><Switch v-model="optionalDaysOff" />Folga no Carnaval e em Corpus Christi</label>
            <div class="space-y-3">
              <div class="flex items-end gap-2">
                <Field class="flex-1">
                  <FieldLabel for="day-off">Outras folgas</FieldLabel>
                  <DateField id="day-off" v-model="newDayOff" :past="10" :future="10" />
                </Field>
                <Button type="button" variant="outline" :disabled="!newDayOff" @click="addDayOff"><Plus aria-hidden="true" />Adicionar</Button>
              </div>
              <p class="text-sm text-muted-foreground">Feriado do estado ou da cidade, emenda ou férias. Os feriados nacionais já ficam de fora.</p>
              <ul v-if="extraDaysOff.length" class="flex flex-wrap gap-2" aria-label="Folgas adicionadas">
                <li v-for="day in extraDaysOff" :key="day">
                  <Badge variant="secondary" class="gap-1 pr-0.5 tabular-nums">
                    {{ isoToNumeric(day) }}
                    <button type="button" class="grid size-5 place-items-center rounded-sm hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-ring" :aria-label="`Remover folga de ${isoToNumeric(day)}`" @click="removeDayOff(day)"><X class="size-3.5" aria-hidden="true" /></button>
                  </Badge>
                </li>
              </ul>
            </div>
            <div v-if="business" role="status" class="space-y-3">
              <p class="flex items-center gap-1.5 text-sm text-muted-foreground"><BriefcaseBusiness class="size-4" aria-hidden="true" />Horas úteis no período</p>
              <p class="text-4xl font-semibold tabular-nums">{{ formatSpan(business.minutes) }}</p>
              <div class="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" class="tabular-nums">{{ decimal(business.minutes) }}</Badge>
                <Badge variant="secondary" class="tabular-nums">{{ business.workdays }} {{ business.workdays === 1 ? 'dia útil' : 'dias úteis' }}</Badge>
              </div>
              <div v-if="business.daysOff.length" class="space-y-1.5 pt-2">
                <p class="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarOff class="size-4" aria-hidden="true" />Ficaram de fora</p>
                <ul class="space-y-1 text-sm">
                  <li v-for="off in business.daysOff" :key="off.date" class="tabular-nums">{{ isoToNumeric(off.date) }}, {{ weekdayName(off.date) }}: {{ off.name }}</li>
                </ul>
              </div>
            </div>
            <EmptyState v-else :icon="BriefcaseBusiness" description="Informe as duas datas e as horas por dia." />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </section>
</template>
