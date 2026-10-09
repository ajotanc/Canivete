<script setup lang="ts">
import { ArrowLeftRight, Ruler, Scale, Zap, Layers } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import CopyField from '@/components/CopyField.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { parseDecimal } from '@/lib/number'
import { CATEGORIES, convert, findCategory, formatQuantity } from './lib/units'

const categoryId = ref(CATEGORIES[0].id)
const category = computed(() => findCategory(categoryId.value) ?? CATEGORIES[0])
const fromId = ref(category.value.units[0].id)
const toId = ref(category.value.units[1].id)
const valueText = ref('1')

// Ao trocar de categoria, as unidades escolhidas passam a ser as duas primeiras dela.
watch(categoryId, () => {
  fromId.value = category.value.units[0].id
  toId.value = category.value.units[1].id
})

const value = computed(() => parseDecimal(valueText.value))
const result = computed(() => (value.value === null ? null : convert(value.value, categoryId.value, fromId.value, toId.value)))
const symbolOf = (id: string) => category.value.units.find((unit) => unit.id === id)?.symbol ?? ''
const resultText = computed(() => (result.value === null ? '' : formatQuantity(result.value)))
const rows = computed(() => (value.value === null ? [] : category.value.units.map((unit) => ({ ...unit, text: formatQuantity(convert(value.value as number, categoryId.value, fromId.value, unit.id)) }))))

function swap() {
  ;[fromId.value, toId.value] = [toId.value, fromId.value]
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Ruler" title="Conversor de unidades" description="Converta comprimento, peso, volume, temperatura, área, velocidade, tempo e dados.">
      <FactList>
        <FactTile :icon="Layers" label="Grupos">8 tipos</FactTile>
        <FactTile :icon="Scale" label="Medidas">Comuns</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Converter</CardTitle>
          <CardDescription>Escolha o tipo de medida, o valor e as duas unidades.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <fieldset>
            <legend class="sr-only">Tipo de medida</legend>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="item in CATEGORIES"
                :key="item.id"
                class="inline-flex min-h-10 cursor-pointer items-center rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 motion-reduce:transition-none"
              >
                <input v-model="categoryId" type="radio" name="category" :value="item.id" class="sr-only" />
                {{ item.label }}
              </label>
            </div>
          </fieldset>

          <Field>
            <FieldLabel for="value">Valor</FieldLabel>
            <Input id="value" v-model="valueText" inputmode="decimal" autocomplete="off" class="tabular-nums" :aria-invalid="valueText && value === null ? true : undefined" />
          </Field>

          <div class="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <Field>
              <FieldLabel for="from">De</FieldLabel>
              <Select v-model="fromId">
                <SelectTrigger id="from" class="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="unit in category.units" :key="unit.id" :value="unit.id">{{ unit.label }} ({{ unit.symbol }})</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Button variant="outline" size="icon" class="mx-auto" aria-label="Trocar as unidades" @click="swap"><ArrowLeftRight aria-hidden="true" /></Button>
            <Field>
              <FieldLabel for="to">Para</FieldLabel>
              <Select v-model="toId">
                <SelectTrigger id="to" class="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="unit in category.units" :key="unit.id" :value="unit.id">{{ unit.label }} ({{ unit.symbol }})</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div class="space-y-2" role="status">
            <p class="text-sm text-muted-foreground">Resultado</p>
            <CopyField :value="resultText" label="Resultado" message="Resultado copiado." placeholder="Digite um valor" input-class="text-base sm:text-xl" class="tabular-nums" />
            <p v-if="resultText" class="text-sm text-muted-foreground tabular-nums">{{ formatQuantity(value ?? 0) }} {{ symbolOf(fromId) }} = {{ resultText }} {{ symbolOf(toId) }}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Em todas as unidades</CardTitle>
          <CardDescription>O mesmo valor em cada unidade de {{ category.label.toLowerCase() }}.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl v-if="rows.length" class="divide-y">
            <div v-for="row in rows" :key="row.id" class="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <dt class="text-sm text-muted-foreground">{{ row.label }}</dt>
              <dd class="font-medium tabular-nums">{{ row.text }} <span class="text-muted-foreground">{{ row.symbol }}</span></dd>
            </div>
          </dl>
          <p v-else class="text-sm text-muted-foreground">Digite um valor para ver a lista.</p>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
