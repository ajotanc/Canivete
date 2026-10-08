<script setup lang="ts">
import { Fuel, Gauge, Scale, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { formatBrl, formatNumber, parseDecimal } from '@/lib/number'
import { compareFuel, RULE_OF_THUMB } from './lib/fuel'

const gasoline = ref('')
const ethanol = ref('')
const knowsConsumption = ref(false)
const gasolineKmL = ref('')
const ethanolKmL = ref('')
const distance = ref('')

const result = computed(() => {
  const gas = parseDecimal(gasoline.value)
  const eth = parseDecimal(ethanol.value)
  if (gas === null || eth === null || gas <= 0 || eth <= 0) return null
  return compareFuel({
    gasoline: gas,
    ethanol: eth,
    gasolineKmL: knowsConsumption.value ? parseDecimal(gasolineKmL.value) : null,
    ethanolKmL: knowsConsumption.value ? parseDecimal(ethanolKmL.value) : null,
    distanceKm: knowsConsumption.value ? parseDecimal(distance.value) : null,
  })
})

const percent = (value: number) => `${formatNumber(Math.round(value * 1000) / 10)}%`
const perKm = (value: number) => `${formatBrl(value)}/km`

const headline = computed(() => {
  if (!result.value) return ''
  if (result.value.winner === 'tie') return 'Tanto faz'
  return result.value.winner === 'ethanol' ? 'Abasteça com etanol' : 'Abasteça com gasolina'
})
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Fuel" title="Gasolina ou etanol" description="Compare os preços do posto e descubra qual combustível compensa mais para o seu carro.">
      <FactList>
        <FactTile :icon="Scale" label="Regra">70% do preço</FactTile>
        <FactTile :icon="Gauge" label="Consumo">Do seu carro</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Preços do posto</CardTitle>
          <CardDescription>Digite os números; a vírgula entra sozinha (5899 vira 5,899).</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div class="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel for="gasoline">Gasolina (R$/L)</FieldLabel>
              <Input id="gasoline" v-model="gasoline" v-maska data-maska="['#,###', '##,###']" inputmode="numeric" autocomplete="off" placeholder="5,899" class="tabular-nums" />
            </Field>
            <Field>
              <FieldLabel for="ethanol">Etanol (R$/L)</FieldLabel>
              <Input id="ethanol" v-model="ethanol" v-maska data-maska="['#,###', '##,###']" inputmode="numeric" autocomplete="off" placeholder="3,999" class="tabular-nums" />
            </Field>
          </div>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel for="knows">Sei o consumo do carro</FieldLabel>
              <FieldDescription>Deixa a conta exata, em vez da regra dos 70%.</FieldDescription>
            </FieldContent>
            <Switch id="knows" v-model="knowsConsumption" />
          </Field>
          <template v-if="knowsConsumption">
            <div class="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel for="gasoline-km">Gasolina (km/L)</FieldLabel>
                <Input id="gasoline-km" v-model="gasolineKmL" inputmode="decimal" autocomplete="off" placeholder="12" class="tabular-nums" />
              </Field>
              <Field>
                <FieldLabel for="ethanol-km">Etanol (km/L)</FieldLabel>
                <Input id="ethanol-km" v-model="ethanolKmL" inputmode="decimal" autocomplete="off" placeholder="8,5" class="tabular-nums" />
              </Field>
            </div>
            <Field>
              <FieldLabel for="distance">Distância da viagem (km), se quiser</FieldLabel>
              <Input id="distance" v-model="distance" inputmode="decimal" autocomplete="off" placeholder="200" class="tabular-nums" />
            </Field>
          </template>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Qual compensa</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="result" role="status" class="space-y-5">
            <div class="space-y-2">
              <Badge :variant="result.winner === 'tie' ? 'secondary' : 'tool'">{{ result.usesConsumption ? 'Pelo consumo do carro' : 'Pela regra dos 70%' }}</Badge>
              <p class="text-3xl font-semibold sm:text-4xl">{{ headline }}</p>
              <p class="text-muted-foreground tabular-nums">
                O etanol custa {{ percent(result.ratio) }} da gasolina. {{ result.usesConsumption ? 'No seu carro' : 'Pela regra' }}, ele compensa até {{ percent(result.breakEven) }}.
              </p>
            </div>
            <dl v-if="result.costPerKm" class="grid gap-2 sm:grid-cols-2">
              <div class="rounded-xl border bg-card p-3">
                <dt class="text-xs text-muted-foreground">Gasolina</dt>
                <dd class="mt-1 font-semibold tabular-nums">{{ perKm(result.costPerKm.gasoline) }}</dd>
                <dd v-if="result.trip" class="text-sm text-muted-foreground tabular-nums">{{ formatBrl(result.trip.gasoline) }} na viagem</dd>
              </div>
              <div class="rounded-xl border bg-card p-3">
                <dt class="text-xs text-muted-foreground">Etanol</dt>
                <dd class="mt-1 font-semibold tabular-nums">{{ perKm(result.costPerKm.ethanol) }}</dd>
                <dd v-if="result.trip" class="text-sm text-muted-foreground tabular-nums">{{ formatBrl(result.trip.ethanol) }} na viagem</dd>
              </div>
            </dl>
            <p v-if="result.savingPercent !== null && result.winner !== 'tie'" class="text-sm font-medium tabular-nums">
              Você gasta {{ formatNumber(Math.round(result.savingPercent * 10) / 10) }}% menos por km com {{ result.winner === 'ethanol' ? 'etanol' : 'gasolina' }}.
            </p>
            <p v-if="!result.usesConsumption" class="text-sm text-muted-foreground">A regra considera que o etanol rende {{ percent(RULE_OF_THUMB) }} do que a gasolina rende. Carros diferentes variam; ligue "Sei o consumo" para uma conta exata.</p>
          </div>
          <EmptyState v-else :icon="Fuel" description="Digite os dois preços para comparar." />
        </CardContent>
      </Card>
    </div>
  </section>
</template>
