<script setup lang="ts">
import { getLocalTimeZone, today, type DateValue } from '@internationalized/date'
import { CalendarIcon } from '@lucide/vue'
import { createYearRange } from 'reka-ui/date'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { dateValueToIso, isoToDateValue, isoToNumeric, numericToIso } from '@/lib/date'
import { makeRoomBelow } from '@/lib/scroll'

/**
 * Campo de data padrão do app: dá para digitar (dd/mm/aaaa, com máscara) ou escolher no calendário.
 * O valor é texto ISO ("AAAA-MM-DD", ou vazio enquanto a data está incompleta ou inválida).
 * `past` e `future` dizem quantos anos o seletor de ano oferece antes e depois de hoje.
 * `minToday` e `maxToday` impedem datas antes ou depois de hoje, tanto no calendário quanto na digitação.
 */
const model = defineModel<string>({ default: '' })
const props = withDefaults(defineProps<{ id?: string; placeholder?: string; past?: number; future?: number; minToday?: boolean; maxToday?: boolean }>(), {
  placeholder: 'dd/mm/aaaa',
  past: 5,
  future: 5,
  minToday: false,
  maxToday: false,
})

const open = ref(false)
const todayValue = today(getLocalTimeZone())
const todayIso = todayValue.toString()

const text = ref(isoToNumeric(model.value))

const inRange = (iso: string) => !(props.minToday && iso < todayIso) && !(props.maxToday && iso > todayIso)

// Digitou: só vira valor quando a data está completa, existe e respeita os limites.
watch(text, (typed) => {
  const iso = numericToIso(typed)
  model.value = iso && inRange(iso) ? iso : ''
})
// Escolheu no calendário (ou o valor mudou por fora): reescreve o texto.
watch(model, (iso) => {
  if (iso !== (numericToIso(text.value) ?? '')) text.value = isoToNumeric(iso)
})

const invalid = computed(() => text.value.length === 10 && model.value === '')

const value = computed<DateValue | undefined>({
  get: () => isoToDateValue(model.value),
  set: (next) => {
    model.value = dateValueToIso(next)
    open.value = false
  },
})

/** Uma data já escolhida fora da faixa amplia a faixa para continuar aparecendo. */
const years = computed(() => {
  const start = props.minToday ? todayValue : todayValue.subtract({ years: props.past })
  const end = props.maxToday ? todayValue : todayValue.add({ years: props.future })
  const selected = value.value
  return createYearRange({ start: selected && selected.year < start.year ? selected : start, end: selected && selected.year > end.year ? selected : end })
})
</script>

<template>
  <div class="space-y-1.5">
    <Popover v-model:open="open">
      <PopoverAnchor as-child>
        <InputGroup class="bg-card">
          <InputGroupInput :id="id" v-model="text" v-maska data-maska="##/##/####" type="text" inputmode="numeric" autocomplete="off" :placeholder="placeholder" class="tabular-nums" :aria-invalid="invalid ? true : undefined" />
          <InputGroupAddon align="inline-end">
            <PopoverTrigger as-child>
              <InputGroupButton size="icon-sm" aria-label="Abrir o calendário" @click.capture="makeRoomBelow">
                <CalendarIcon aria-hidden="true" />
              </InputGroupButton>
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent align="end" class="w-(--reka-popover-anchor-width) min-w-72 max-w-[22rem] p-0">
        <Calendar v-model="value" :default-placeholder="value ?? todayValue" :min-value="minToday ? todayValue : undefined" :max-value="maxToday ? todayValue : undefined" :year-range="years" locale="pt-BR" weekday-format="short" layout="month-and-year" initial-focus />
        <div class="border-t p-1">
          <Button type="button" variant="ghost" size="sm" class="w-full" :disabled="!inRange(todayIso)" @click="value = todayValue">Hoje</Button>
        </div>
      </PopoverContent>
    </Popover>
    <p v-if="invalid" role="alert" class="text-sm text-destructive">Essa data não existe ou está fora do período permitido.</p>
  </div>
</template>
