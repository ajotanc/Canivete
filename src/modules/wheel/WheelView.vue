<script setup lang="ts">
import { CircleDot, Dices, RotateCw, Trophy, Zap } from '@lucide/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import { triggerConfetti } from '@/core/effects/confetti'
import { play } from '@/core/effects/sound'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import TagInput from '@/components/TagInput.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { secureRandomInt } from '@/lib/random'
import { colorIndex, fitLabel, labelSize, MAX_OPTIONS, MIN_OPTIONS, PALETTE, sliceCenter, slicePath, spinTarget } from './lib/wheel'

const SPIN_MS = 5600
const BULBS = 28

const options = ref<string[]>(['Pizza', 'Hambúrguer', 'Sushi', 'Salada', 'Churrasco'])
const removeWinner = ref(false)
const rotation = ref(0)
const spinning = ref(false)
const winner = ref<string | null>(null)
const history = ref<string[]>([])

const wheel = ref<HTMLElement>()
const pointer = ref<HTMLElement>()
/** Fatia sorteada que fica em destaque depois do giro. */
const winnerIndex = ref<number | null>(null)
let frame = 0
let timer: ReturnType<typeof setTimeout> | undefined

const count = computed(() => options.value.length)
const ready = computed(() => count.value >= MIN_OPTIONS)
const size = computed(() => labelSize(count.value))
/** Lâmpadas do aro, que piscam enquanto a roleta gira. */
const bulbs = Array.from({ length: BULBS }, (_, index) => {
  const angle = ((index * 360) / BULBS - 90) * (Math.PI / 180)
  return { x: 50 + 52.2 * Math.cos(angle), y: 50 + 52.2 * Math.sin(angle), odd: index % 2 === 1 }
})
/** Pinos nas divisórias das fatias, onde o ponteiro bate. */
const pegs = computed(() =>
  Array.from({ length: count.value }, (_, index) => {
    const angle = ((index * 360) / count.value - 90) * (Math.PI / 180)
    return { x: 50 + 48.6 * Math.cos(angle), y: 50 + 48.6 * Math.sin(angle) }
  }),
)


/** Ângulo atual da roleta (0 a 360), lido da transformação em andamento da animação. */
function currentAngle(): number {
  if (!wheel.value) return 0
  const matrix = getComputedStyle(wheel.value).transform
  if (!matrix || matrix === 'none') return 0
  const [a, b] = matrix.slice(matrix.indexOf('(') + 1, -1).split(',').map(Number)
  return (((Math.atan2(b, a) * 180) / Math.PI) % 360 + 360) % 360
}

/** Cada vez que uma divisória passa pelo ponteiro, ele dá um tranco (e o celular vibra de leve). */
function watchTicks(total: number): void {
  const step = 360 / total
  let last = Math.floor(currentAngle() / step)
  const loop = () => {
    const slice = Math.floor(currentAngle() / step)
    if (slice !== last) {
      last = slice
      pointer.value?.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-26deg)', offset: 0.35 }, { transform: 'rotate(0deg)' }], { duration: 120 })
      play('tick')
      navigator.vibrate?.(5)
    }
    frame = requestAnimationFrame(loop)
  }
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(loop)
}

async function spin() {
  if (spinning.value || !ready.value) return
  // O sorteio sai antes do giro; a roleta só é desenhada para parar nele.
  const list = [...options.value]
  const index = secureRandomInt(list.length)
  const from = rotation.value
  const to = spinTarget(from, index, list.length, 6 + secureRandomInt(3), secureRandomInt(1000) / 999)
  rotation.value = to
  winner.value = null
  winnerIndex.value = null
  spinning.value = true
  play('whoosh')
  if (wheel.value) {
    watchTicks(list.length)
    await wheel.value.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }], { duration: SPIN_MS, easing: 'cubic-bezier(0.1, 0.55, 0.05, 1)' }).finished.catch(() => undefined)
    cancelAnimationFrame(frame)
  }
  spinning.value = false
  winner.value = list[index]
  winnerIndex.value = index
  history.value = [list[index], ...history.value].slice(0, 8)
  play('win')
  triggerConfetti({ colors: PALETTE.map((name) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()).filter(Boolean), durationMs: 1800 })
  if (removeWinner.value && options.value.length > MIN_OPTIONS - 1) {
    // Tira a fatia sorteada depois de um instante, para dar tempo de ver onde a roleta parou.
    clearTimeout(timer)
    timer = setTimeout(() => {
      options.value = options.value.filter((option) => option !== list[index])
      rotation.value = 0
      winnerIndex.value = null
    }, 2200)
  }
}

onBeforeUnmount(() => {
  clearTimeout(timer)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="CircleDot" title="Roleta" description="Coloque as opções, gire a roleta e deixe a sorte decidir. Serve para o almoço, o filme, a vez de quem lava a louça.">
      <FactList>
        <FactTile :icon="Dices" label="Opções">2 a 24</FactTile>
        <FactTile :icon="RotateCw" label="Giro">Sem vício</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">As opções</CardTitle>
          <CardDescription>Digite e aperte Enter ou vírgula. Cada opção vira uma fatia.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <Field>
            <FieldLabel for="options" class="sr-only">Opções da roleta</FieldLabel>
            <TagInput id="options" v-model="options" :max-items="MAX_OPTIONS" :max-length="40" placeholder="Nova opção" />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel for="remove-winner">Tirar a sorteada</FieldLabel>
              <FieldDescription>A opção que sair deixa a roleta, para eliminar uma a uma.</FieldDescription>
            </FieldContent>
            <Switch id="remove-winner" v-model="removeWinner" />
          </Field>
          <Button size="lg" class="w-full" :disabled="!ready || spinning" @click="spin">
            <RotateCw aria-hidden="true" />
            {{ spinning ? 'Girando…' : 'Girar a roleta' }}
          </Button>
          <p v-if="!ready" class="text-sm text-muted-foreground">Coloque pelo menos {{ MIN_OPTIONS }} opções para girar.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Roleta</CardTitle>
        </CardHeader>
        <CardContent class="space-y-5">
          <div v-if="ready" class="relative mx-auto aspect-square w-full max-w-sm">
            <!-- Ponteiro: pino que dá um tranco a cada divisória -->
            <span ref="pointer" class="absolute left-1/2 top-0 z-10 h-9 w-7 origin-top -translate-x-1/2 -translate-y-[35%] drop-shadow-md" aria-hidden="true">
              <svg viewBox="0 0 28 36" class="size-full"><path d="M14 35 L2.5 13 A12.5 12.5 0 1 1 25.5 13 Z" class="fill-foreground stroke-card" stroke-width="2" stroke-linejoin="round" /><circle cx="14" cy="12.5" r="4" class="fill-card" /></svg>
            </span>
            <svg ref="wheel" viewBox="-7 -7 114 114" class="size-full drop-shadow-lg" :style="{ transform: `rotate(${rotation}deg)` }" role="img" aria-label="Roleta com as opções">
              <defs>
                <radialGradient id="wheel-shine" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stop-color="#fff" stop-opacity="0.45" />
                  <stop offset="0.6" stop-color="#fff" stop-opacity="0.05" />
                  <stop offset="1" stop-color="#000" stop-opacity="0.18" />
                </radialGradient>
                <radialGradient id="wheel-hub" cx="0.35" cy="0.3" r="0.9">
                  <stop offset="0" stop-color="#fff" />
                  <stop offset="1" stop-color="#cfd4dc" />
                </radialGradient>
              </defs>
              <!-- Aro com lâmpadas -->
              <circle cx="50" cy="50" r="55" class="fill-foreground" />
              <circle cx="50" cy="50" r="53.4" class="fill-none stroke-card/40" stroke-width="0.4" />
              <circle v-for="(bulb, index) in bulbs" :key="`bulb-${index}`" :cx="bulb.x" :cy="bulb.y" r="1.35" :class="spinning && bulb.odd ? 'animate-pulse motion-reduce:animate-none' : ''" :style="{ fill: bulb.odd ? '#fff3bd' : 'var(--amber)' }" />
              <circle cx="50" cy="50" r="50.8" class="fill-card" />
              <g v-for="(option, index) in options" :key="`${index}-${option}`" class="transition-opacity duration-500" :opacity="winnerIndex !== null && winnerIndex !== index ? 0.4 : 1">
                <path :d="slicePath(index, count)" :style="{ fill: `var(--${PALETTE[colorIndex(index, count)]})` }" class="stroke-card" stroke-width="0.5" />
                <text
                  x="91"
                  y="50"
                  text-anchor="end"
                  dominant-baseline="central"
                  font-weight="800"
                  :font-size="size"
                  stroke="rgb(0 0 0 / 0.22)"
                  stroke-width="0.4"
                  paint-order="stroke"
                  :transform="`rotate(${sliceCenter(index, count) - 90} 50 50)`"
                  :style="{ fill: `var(--${PALETTE[colorIndex(index, count)]}-foreground)` }"
                >
                  {{ fitLabel(option, count > 12 ? 10 : 14) }}
                </text>
              </g>
              <circle cx="50" cy="50" r="50" fill="url(#wheel-shine)" class="pointer-events-none" />
              <circle v-for="(peg, index) in pegs" :key="`peg-${index}`" :cx="peg.x" :cy="peg.y" r="1.15" class="fill-card stroke-foreground/40" stroke-width="0.3" />
              <circle cx="50" cy="50" r="7.5" class="fill-foreground" />
              <circle cx="50" cy="50" r="6.2" fill="url(#wheel-hub)" />
              <circle cx="50" cy="50" r="2" class="fill-foreground/70" />
            </svg>
          </div>
          <EmptyState v-else :icon="CircleDot" description="Adicione pelo menos 2 opções para ver a roleta." class="py-16" />

          <div class="min-h-16 text-center" role="status">
            <template v-if="winner">
              <p class="flex items-center justify-center gap-1.5 text-sm text-muted-foreground"><Trophy class="size-4" aria-hidden="true" />A sorte escolheu</p>
              <p class="text-3xl font-semibold">{{ winner }}</p>
            </template>
            <p v-else-if="spinning" class="pt-4 text-lg text-muted-foreground">Girando…</p>
            <p v-else class="pt-4 text-muted-foreground">Gire a roleta para sortear.</p>
          </div>

          <div v-if="history.length > 1" class="space-y-2">
            <h3 class="text-sm font-medium">Últimos resultados</h3>
            <ul class="flex flex-wrap gap-2">
              <li v-for="(item, index) in history" :key="`${index}-${item}`"><Badge :variant="index === 0 ? 'tool' : 'secondary'">{{ item }}</Badge></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
