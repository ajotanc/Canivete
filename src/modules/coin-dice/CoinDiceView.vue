<script setup lang="ts">
import { Coins, Dices, Hash, RotateCcw, Zap } from '@lucide/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import NumberInput from '@/components/NumberInput.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { COIN_LABEL, DIE_SIDES, diceNotation, flipCoin, MAX_DICE, rollDice, type CoinSide, type DiceRoll } from './lib/roll'

const tab = ref('coin')

// Moeda
const FLIP_MS = 900
const coinSide = ref<CoinSide | null>(null)
/** Meias-voltas acumuladas; sempre cresce, para a moeda girar para o mesmo lado a cada sorteio. */
const turns = ref(0)
const flipping = ref(false)
const tally = ref<Record<CoinSide, number>>({ heads: 0, tails: 0 })
let flipTimer: ReturnType<typeof setTimeout> | undefined

function flip() {
  if (flipping.value) return
  const side = flipCoin()
  const spins = 5
  // Cara fica de frente em múltiplos pares de meias-voltas, coroa nos ímpares.
  const base = Math.ceil(turns.value / 2) * 2
  turns.value = base + spins * 2 + (side === 'tails' ? 1 : 0)
  flipping.value = true
  clearTimeout(flipTimer)
  flipTimer = setTimeout(() => {
    coinSide.value = side
    tally.value = { ...tally.value, [side]: tally.value[side] + 1 }
    flipping.value = false
  }, FLIP_MS)
}
function resetCoin() {
  clearTimeout(flipTimer)
  flipping.value = false
  coinSide.value = null
  tally.value = { heads: 0, tails: 0 }
}

// Dados
const diceCount = ref(2)
const sides = ref<number>(6)
const last = ref<DiceRoll | null>(null)
const rollId = ref(0)
const history = ref<Array<{ id: number; label: string; total: number }>>([])

const count = computed(() => Math.min(MAX_DICE, Math.max(1, Math.floor(Number(diceCount.value)) || 1)))

function roll() {
  const result = rollDice(count.value, sides.value)
  last.value = result
  rollId.value++
  history.value = [{ id: rollId.value, label: diceNotation(count.value, sides.value), total: result.total }, ...history.value].slice(0, 8)
}
function onSides(value: unknown) {
  const amount = Number(value)
  if ((DIE_SIDES as readonly number[]).includes(amount)) sides.value = amount
}

onBeforeUnmount(() => clearTimeout(flipTimer))
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Coins" title="Cara ou coroa e dados" description="Jogue uma moeda ou role de 1 a 10 dados, de 4 a 100 faces, para decidir qualquer coisa.">
      <FactList>
        <FactTile :icon="Coins" label="Moeda">Cara ou coroa</FactTile>
        <FactTile :icon="Dices" label="Dados">D4 a D100</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <Card>
      <CardContent class="pt-6">
        <Tabs v-model="tab">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="coin">Moeda</TabsTrigger>
            <TabsTrigger value="dice">Dados</TabsTrigger>
          </TabsList>

          <TabsContent value="coin" class="mt-6 space-y-6">
            <div class="flex justify-center [perspective:800px]">
              <div
                class="relative size-36 transition-transform duration-[900ms] ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
                :style="{ transform: `rotateY(${turns * 180}deg)` }"
                role="img"
                :aria-label="coinSide ? COIN_LABEL[coinSide] : 'Moeda'"
              >
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full border-4 border-primary-foreground/30 bg-primary text-primary-foreground shadow-lg [backface-visibility:hidden]">
                  <Coins class="size-10" aria-hidden="true" />
                  <span class="text-lg font-semibold">Cara</span>
                </div>
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full border-4 border-foreground/20 bg-card text-card-foreground shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <Hash class="size-10" aria-hidden="true" />
                  <span class="text-lg font-semibold">Coroa</span>
                </div>
              </div>
            </div>
            <div class="text-center" role="status">
              <p class="min-h-9 text-3xl font-semibold">{{ flipping ? '' : coinSide ? COIN_LABEL[coinSide] : 'Jogue a moeda' }}</p>
              <p class="mt-1 text-sm text-muted-foreground tabular-nums">Cara {{ tally.heads }} · Coroa {{ tally.tails }}</p>
            </div>
            <div class="flex flex-wrap justify-center gap-3">
              <Button size="lg" class="min-w-40" :disabled="flipping" @click="flip"><Coins aria-hidden="true" />Jogar a moeda</Button>
              <Button size="lg" variant="outline" :disabled="flipping || (tally.heads === 0 && tally.tails === 0)" @click="resetCoin"><RotateCcw aria-hidden="true" />Zerar</Button>
            </div>
          </TabsContent>

          <TabsContent value="dice" class="mt-6 space-y-6">
            <div class="grid gap-5 sm:grid-cols-2">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel for="dice-count">Dados</FieldLabel>
                  <FieldDescription>De 1 a {{ MAX_DICE }}.</FieldDescription>
                </FieldContent>
                <NumberInput id="dice-count" v-model="diceCount" :min="1" :max="MAX_DICE" />
              </Field>
              <Field>
                <FieldLabel for="dice-sides">Faces</FieldLabel>
                <ToggleGroup id="dice-sides" type="single" variant="outline" :model-value="String(sides)" aria-label="Faces" class="w-full flex-wrap bg-card" @update:model-value="onSides">
                  <ToggleGroupItem v-for="face in DIE_SIDES" :key="face" :value="String(face)" class="flex-1 px-0 tabular-nums data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">D{{ face }}</ToggleGroupItem>
                </ToggleGroup>
              </Field>
            </div>
            <Button size="lg" class="w-full sm:w-auto" @click="roll"><Dices aria-hidden="true" />Rolar {{ diceNotation(count, sides) }}</Button>

            <div v-if="last" role="status" class="space-y-4">
              <ul :key="rollId" class="flex flex-wrap gap-2">
                <li
                  v-for="(value, index) in last.rolls"
                  :key="index"
                  class="flex size-14 items-center justify-center rounded-xl border bg-card text-2xl font-semibold tabular-nums animate-in zoom-in-75 duration-300 motion-reduce:animate-none"
                >
                  {{ value }}
                </li>
              </ul>
              <p class="text-lg"><span class="text-muted-foreground">Total:</span> <span class="font-semibold tabular-nums">{{ last.total }}</span></p>
            </div>
            <EmptyState v-else :icon="Dices" description="O resultado dos dados aparece aqui." />

            <div v-if="history.length > 1" class="space-y-2">
              <h3 class="text-sm font-medium">Últimas jogadas</h3>
              <ul class="divide-y rounded-xl border bg-card">
                <li v-for="item in history" :key="item.id" class="flex items-baseline justify-between px-4 py-2 tabular-nums">
                  <span class="text-sm text-muted-foreground">{{ item.label }}</span>
                  <span class="font-medium">{{ item.total }}</span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </section>
</template>
