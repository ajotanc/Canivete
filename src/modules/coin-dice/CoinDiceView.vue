<script setup lang="ts">
import { Coins, Dices, RotateCcw, Zap } from '@lucide/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import { play } from '@/core/effects/sound'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import NumberInput from '@/components/NumberInput.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import CoinPiece from './components/CoinPiece.vue'
import DiceFace from './components/DiceFace.vue'
import { COIN_LABEL, DIE_SIDES, diceNotation, flipCoin, MAX_DICE, rollDice, TOSS_LANDS_AT, TOSS_MS, type CoinSide, type DiceRoll } from './lib/roll'

const tab = ref('coin')

// Moeda
const coin = ref<InstanceType<typeof CoinPiece>>()
const coinSide = ref<CoinSide | null>(null)
const flipping = ref(false)
let landTimer: ReturnType<typeof setTimeout> | undefined
const tally = ref<Record<CoinSide, number>>({ heads: 0, tails: 0 })

async function flip() {
  if (flipping.value || !coin.value) return
  const side = flipCoin()
  flipping.value = true
  play('toss')
  // O som da queda sai quando a moeda toca a mesa, não quando o movimento todo termina.
  clearTimeout(landTimer)
  landTimer = setTimeout(() => play('land'), TOSS_MS * TOSS_LANDS_AT)
  await coin.value.toss(side)
  coinSide.value = side
  tally.value = { ...tally.value, [side]: tally.value[side] + 1 }
  flipping.value = false
}
function resetCoin() {
  coinSide.value = null
  tally.value = { heads: 0, tails: 0 }
}

// Dados
const ROLL_MS = 900
const diceCount = ref(2)
const sides = ref<number>(6)
const last = ref<DiceRoll | null>(null)
const rollId = ref(0)
const rolling = ref(false)
const history = ref<Array<{ id: number; label: string; total: number }>>([])
let rollTimer: ReturnType<typeof setTimeout> | undefined

const count = computed(() => Math.min(MAX_DICE, Math.max(1, Math.floor(Number(diceCount.value)) || 1)))

function roll() {
  if (rolling.value) return
  const result = rollDice(count.value, sides.value)
  play('dice', count.value)
  last.value = result
  rollId.value++
  rolling.value = true
  clearTimeout(rollTimer)
  // O resultado só entra no total e no histórico quando os dados param.
  const id = rollId.value
  const label = diceNotation(count.value, sides.value)
  rollTimer = setTimeout(() => {
    rolling.value = false
    history.value = [{ id, label, total: result.total }, ...history.value].slice(0, 8)
  }, ROLL_MS + 210)
}
function onSides(value: unknown) {
  const amount = Number(value)
  if ((DIE_SIDES as readonly number[]).includes(amount)) sides.value = amount
}

onBeforeUnmount(() => {
  clearTimeout(rollTimer)
  clearTimeout(landTimer)
})
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Coins" title="Cara ou coroa e dados" description="Jogue uma moeda ou role de 1 a 10 dados, de 4 a 100 faces, para decidir qualquer coisa.">
      <FactList>
        <FactTile :icon="Coins" label="Cara ou coroa">50% cada</FactTile>
        <FactTile :icon="Dices" label="Faces">4 a 100</FactTile>
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
            <!-- A própria moeda é o botão: só aceita outro toque depois que a jogada anterior pousou e entrou na contagem. -->
            <div class="flex min-h-[26rem] items-center justify-center">
              <button
                type="button"
                class="group/coin rounded-3xl p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 enabled:cursor-pointer disabled:cursor-default"
                :disabled="flipping"
                :aria-label="flipping ? 'A moeda está no ar' : 'Jogar a moeda'"
                @click="flip"
              >
                <CoinPiece ref="coin" class="transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-enabled/coin:group-hover/coin:-translate-y-1 group-enabled/coin:group-active/coin:scale-[0.97] motion-reduce:transition-none" />
              </button>
            </div>
            <div class="text-center" role="status">
              <p class="min-h-9 text-3xl font-semibold">{{ flipping ? '' : coinSide ? COIN_LABEL[coinSide] : 'Toque na moeda' }}</p>
              <p class="mt-1 text-sm text-muted-foreground tabular-nums">
                {{ flipping ? 'No ar…' : coinSide ? 'Toque de novo para jogar outra vez' : 'Nenhuma jogada ainda' }}
              </p>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <p class="flex h-11 items-center gap-3 rounded-lg border bg-card px-4 text-sm tabular-nums">
                <span><span class="text-muted-foreground">Cara</span> <span class="font-semibold">{{ tally.heads }}</span></span>
                <span class="h-4 w-px bg-border" aria-hidden="true" />
                <span><span class="text-muted-foreground">Coroa</span> <span class="font-semibold">{{ tally.tails }}</span></span>
              </p>
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
            <Button size="lg" class="w-full sm:w-auto" :disabled="rolling" @click="roll"><Dices aria-hidden="true" />Rolar {{ diceNotation(count, sides) }}</Button>

            <div v-if="last" class="space-y-4" role="status">
              <ul class="flex min-h-32 flex-wrap items-end justify-center gap-6 pt-8 sm:justify-start">
                <li v-for="(value, index) in last.rolls" :key="index">
                  <DiceFace :sides="last.sides" :value="value" :roll-key="rollId" :rolling="rolling" />
                </li>
              </ul>
              <p v-if="!rolling" class="text-lg"><span class="text-muted-foreground">Total:</span> <span class="font-semibold tabular-nums">{{ last.total }}</span></p>
              <p v-else class="text-lg text-muted-foreground">Rolando…</p>
            </div>
            <EmptyState v-else :icon="Dices" description="Os dados aparecem aqui quando você rolar." />

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
