<script setup lang="ts">
import { getLocalTimeZone, today, type DateValue } from '@internationalized/date'
import { CalendarIcon } from '@lucide/vue'
import { createYearRange } from 'reka-ui/date'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { dateValueToIso, formatDateNumeric, isoToDateValue } from '@/lib/date'
import { makeRoomBelow } from '@/lib/scroll'
import { cn } from '@/lib/utils'

/**
 * Campo de data com o seletor de calendário do app. O valor é texto ISO ("AAAA-MM-DD", ou vazio); o botão mostra dd/mm/aaaa.
 * `past` e `future` dizem quantos anos o seletor de ano oferece antes e depois de hoje.
 */
const model = defineModel<string>({ default: '' })
const props = withDefaults(defineProps<{ id?: string; placeholder?: string; past?: number; future?: number; maxToday?: boolean; class?: string }>(), {
  placeholder: 'dd/mm/aaaa',
  past: 5,
  future: 5,
  maxToday: false,
})

const open = ref(false)
const todayValue = today(getLocalTimeZone())

const value = computed<DateValue | undefined>({
  get: () => isoToDateValue(model.value),
  set: (next) => {
    model.value = dateValueToIso(next)
    open.value = false
  },
})

/** Uma data já escolhida fora da faixa amplia a faixa para continuar aparecendo. */
const years = computed(() => {
  const start = todayValue.subtract({ years: props.past })
  const end = props.maxToday ? todayValue : todayValue.add({ years: props.future })
  const selected = value.value
  return createYearRange({ start: selected && selected.year < start.year ? selected : start, end: selected && selected.year > end.year ? selected : end })
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button :id="id" type="button" variant="outline" :class="cn('w-full justify-start text-left font-normal tabular-nums', !value && 'text-muted-foreground', props.class)" @click.capture="makeRoomBelow">
        <CalendarIcon aria-hidden="true" />
        {{ value ? formatDateNumeric(value) : placeholder }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-(--reka-popover-trigger-width) min-w-72 max-w-[22rem] p-0">
      <Calendar v-model="value" :default-placeholder="value ?? todayValue" :max-value="maxToday ? todayValue : undefined" :year-range="years" locale="pt-BR" weekday-format="short" layout="month-and-year" initial-focus />
      <div class="border-t p-1">
        <Button type="button" variant="ghost" size="sm" class="w-full" @click="value = todayValue">Hoje</Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
