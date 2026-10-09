<script setup lang="ts">
import { CalendarDays, ChevronLeft, ChevronRight, Globe, PartyPopper, Zap } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import CardSkeleton from '@/components/skeletons/CardSkeleton.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatLong, todayIso, weekdayName } from '@/modules/dates/lib/dates'
import { daysUntil, loadHolidays, nextHoliday, type HolidayList } from './lib/holidays'

const today = todayIso()
const thisYear = Number(today.slice(0, 4))
const year = ref(thisYear)
const loading = ref(true)
const list = ref<HolidayList | null>(null)
/** Descarta a resposta de um ano que já não está na tela. */
let request = 0

async function load() {
  const id = ++request
  loading.value = true
  const result = await loadHolidays(year.value)
  if (id !== request) return
  list.value = result
  loading.value = false
}
function go(step: number) {
  year.value += step
  void load()
}
onMounted(load)

const next = computed(() => (year.value === thisYear && list.value ? nextHoliday(list.value.holidays, today) : undefined))
const rows = computed(() =>
  (list.value?.holidays ?? []).map((holiday) => {
    const weekday = weekdayName(holiday.date)
    return { ...holiday, weekday, weekend: weekday === 'sábado' || weekday === 'domingo', left: daysUntil(holiday.date, today), long: formatLong(holiday.date) }
  }),
)
const countLabel = (left: number) => (left === 0 ? 'Hoje' : left === 1 ? 'Amanhã' : left > 1 ? `Em ${left} dias` : `Há ${-left} dias`)
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="PartyPopper" title="Feriados do ano" description="Todos os feriados nacionais do ano, com o dia da semana e quantos dias faltam.">
      <FactList>
        <FactTile :icon="CalendarDays" label="Lista">12 meses</FactTile>
        <FactTile :icon="Globe" label="Fonte">BrasilAPI</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <Card>
      <CardHeader class="flex-row items-center justify-between gap-3">
        <div class="min-w-0">
          <CardTitle class="text-lg tabular-nums">{{ year }}</CardTitle>
          <CardDescription v-if="next">Próximo: {{ next.name }}, {{ countLabel(daysUntil(next.date, today)).toLowerCase() }}.</CardDescription>
          <CardDescription v-else-if="list && !list.live">Sem conexão: só os feriados calculados (sem Carnaval nem Corpus Christi).</CardDescription>
          <CardDescription v-else>Feriados nacionais. Os estaduais e municipais não entram.</CardDescription>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Ano anterior" :disabled="loading" @click="go(-1)"><ChevronLeft aria-hidden="true" /></Button>
          <Button variant="outline" size="icon" aria-label="Próximo ano" :disabled="loading" @click="go(1)"><ChevronRight aria-hidden="true" /></Button>
        </div>
      </CardHeader>
      <CardContent aria-live="polite">
        <CardSkeleton v-if="loading" :lines="1" :rows="6" />
        <EmptyState v-else-if="rows.length === 0" :icon="PartyPopper" description="Nenhum feriado encontrado para este ano." />
        <ul v-else class="divide-y rounded-xl border bg-card">
          <li v-for="row in rows" :key="row.date" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3" :class="row.date === next?.date ? 'bg-tool/10' : ''">
            <div class="min-w-0">
              <p class="font-medium">{{ row.name }}</p>
              <p class="text-sm text-muted-foreground">{{ row.long }}</p>
            </div>
            <div class="flex items-center gap-2">
              <Badge v-if="row.weekend" variant="outline">Fim de semana</Badge>
              <span class="text-sm capitalize text-muted-foreground">{{ row.weekday }}</span>
              <Badge v-if="year === thisYear" variant="tool-tint" class="tabular-nums">{{ countLabel(row.left) }}</Badge>
            </div>
          </li>
        </ul>
      </CardContent>
    </Card>
  </section>
</template>
