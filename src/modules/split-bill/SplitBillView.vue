<script setup lang="ts">
import { Calculator, Copy, HandCoins, Percent, Users, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import NumberInput from '@/components/NumberInput.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { parseMoney } from '@/lib/money'
import { formatCents, splitBill, splitMessage } from './lib/split'

const TIPS = [0, 5, 10, 12, 15] as const

const bill = ref('')
const people = ref(4)
const tip = ref<number>(10)
const roundUp = ref(false)

const billCents = computed(() => {
  const value = parseMoney(bill.value)
  return value === null ? null : Math.round(value * 100)
})
const count = computed(() => Math.max(1, Math.floor(Number(people.value)) || 1))
const result = computed(() => (billCents.value ? splitBill({ billCents: billCents.value, people: count.value, tipPercent: tip.value, roundUp: roundUp.value }) : null))

function onTip(value: unknown) {
  const amount = Number(value)
  if ((TIPS as readonly number[]).includes(amount)) tip.value = amount
}

async function copyMessage() {
  if (!result.value) return
  try {
    await navigator.clipboard.writeText(splitMessage(result.value, count.value, tip.value))
    toast.success('Texto copiado.')
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="HandCoins" title="Racha-conta" description="Divida a conta do restaurante entre todo mundo, com gorjeta, sem sobrar nem faltar um centavo.">
      <FactList>
        <FactTile :icon="Percent" label="Gorjeta">Opcional</FactTile>
        <FactTile :icon="Calculator" label="Centavos">Fecham certo</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">A conta</CardTitle>
          <CardDescription>O resultado muda enquanto você digita.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <Field>
            <FieldLabel for="bill">Valor da conta</FieldLabel>
            <Input id="bill" v-model="bill" v-money placeholder="R$ 200,00" inputmode="numeric" autocomplete="off" class="tabular-nums" />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel for="people">Pessoas</FieldLabel>
              <FieldDescription>Quantos vão dividir.</FieldDescription>
            </FieldContent>
            <NumberInput id="people" v-model="people" :min="1" :max="100" />
          </Field>
          <Field>
            <FieldLabel for="tip">Gorjeta</FieldLabel>
            <ToggleGroup id="tip" type="single" variant="outline" :model-value="String(tip)" aria-label="Gorjeta" class="w-full bg-card" @update:model-value="onTip">
              <ToggleGroupItem v-for="amount in TIPS" :key="amount" :value="String(amount)" class="flex-1 px-0 tabular-nums data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{{ amount }}%</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel for="round-up">Valores redondos</FieldLabel>
              <FieldDescription>Cada um paga em reais inteiros; a sobra vira gorjeta extra.</FieldDescription>
            </FieldContent>
            <Switch id="round-up" v-model="roundUp" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Quanto cada um paga</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="result" role="status" class="space-y-5">
            <div>
              <p class="flex items-center gap-1.5 text-sm text-muted-foreground"><Users class="size-4" aria-hidden="true" />{{ count }} {{ count === 1 ? 'pessoa' : 'pessoas' }}</p>
              <p class="text-4xl font-semibold tabular-nums sm:text-5xl">{{ formatCents(result.shareCents) }}</p>
              <p v-if="result.higherCount > 0" class="mt-1 text-sm text-muted-foreground tabular-nums">
                {{ count - result.higherCount }} {{ count - result.higherCount === 1 ? 'pessoa paga' : 'pessoas pagam' }} esse valor e {{ result.higherCount }} {{ result.higherCount === 1 ? 'paga' : 'pagam' }} {{ formatCents(result.shareCents + 1) }}, para fechar a conta.
              </p>
            </div>
            <dl class="divide-y">
              <div class="flex items-baseline justify-between py-2.5 first:pt-0">
                <dt class="text-sm text-muted-foreground">Conta</dt>
                <dd class="font-medium tabular-nums">{{ formatCents(result.billCents) }}</dd>
              </div>
              <div class="flex items-baseline justify-between py-2.5">
                <dt class="text-sm text-muted-foreground">Gorjeta ({{ tip }}%)</dt>
                <dd class="font-medium tabular-nums">{{ formatCents(result.tipCents) }}</dd>
              </div>
              <div class="flex items-baseline justify-between py-2.5" :class="result.surplusCents === 0 && 'last:pb-0'">
                <dt class="text-sm text-muted-foreground">Total</dt>
                <dd class="font-semibold tabular-nums">{{ formatCents(result.totalCents) }}</dd>
              </div>
              <div v-if="result.surplusCents > 0" class="flex items-baseline justify-between py-2.5 last:pb-0">
                <dt class="text-sm text-muted-foreground">Sobra do arredondamento</dt>
                <dd class="font-medium tabular-nums">{{ formatCents(result.surplusCents) }}</dd>
              </div>
            </dl>
            <Button variant="outline" class="w-full" @click="copyMessage">
              <Copy aria-hidden="true" />
              Copiar texto para o grupo
            </Button>
          </div>
          <EmptyState v-else :icon="HandCoins" description="Digite o valor da conta para ver quanto cada um paga." />
        </CardContent>
      </Card>
    </div>
  </section>
</template>
