<script setup lang="ts">
import { BellRing, Flag, Pause, Play, RotateCcw, Timer, Zap, Coffee, Brain, Hourglass } from '@lucide/vue'
import { useIntervalFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { beep } from './lib/beep'
import { DEFAULT_POMODORO, elapsed, formatClock, formatCountdown, idle, isRunning, nextPhase, pause, phaseMinutes, remainingMs, start, type PomodoroPhase, type Run } from './lib/clock'

const tab = ref('stopwatch')
/** Horário atual, atualizado vinte vezes por segundo para os centésimos do cronômetro. */
const now = ref(Date.now())
useIntervalFn(() => (now.value = Date.now()), 50)

// Cronômetro
const stopwatch = ref<Run>(idle())
const laps = ref<number[]>([])
const stopwatchMs = computed(() => elapsed(stopwatch.value, now.value))

function toggleStopwatch() {
  stopwatch.value = isRunning(stopwatch.value) ? pause(stopwatch.value, Date.now()) : start(stopwatch.value, Date.now())
}
function lap() {
  if (isRunning(stopwatch.value)) laps.value = [stopwatchMs.value, ...laps.value]
}
function resetStopwatch() {
  stopwatch.value = idle()
  laps.value = []
}
/** Tempo de cada volta (diferença para a anterior). */
const lapRows = computed(() => laps.value.map((total, index) => ({ number: laps.value.length - index, total, split: total - (laps.value[index + 1] ?? 0) })))

// Timer
const PRESETS = [1, 5, 10, 15, 30] as const
const minutesText = ref('5')
const secondsText = ref('0')
const timerRun = ref<Run>(idle())
/** Duração em curso; só muda ao iniciar, para editar os campos não mexer na contagem. */
const timerDuration = ref(0)
const finished = ref(false)

const configuredMs = computed(() => (Number.parseInt(minutesText.value, 10) || 0) * 60_000 + (Number.parseInt(secondsText.value, 10) || 0) * 1000)
const timerActive = computed(() => timerDuration.value > 0)
const timerLeft = computed(() => (timerActive.value ? remainingMs(timerDuration.value, timerRun.value, now.value) : configuredMs.value))

function toggleTimer() {
  finished.value = false
  if (isRunning(timerRun.value)) {
    timerRun.value = pause(timerRun.value, Date.now())
    return
  }
  if (!timerActive.value) {
    if (configuredMs.value <= 0) return
    timerDuration.value = configuredMs.value
  }
  timerRun.value = start(timerRun.value, Date.now())
}
function resetTimer() {
  timerRun.value = idle()
  timerDuration.value = 0
  finished.value = false
}
function usePreset(minutes: number) {
  resetTimer()
  minutesText.value = String(minutes)
  secondsText.value = '0'
}

// Pomodoro
const phase = ref<PomodoroPhase>('focus')
const completedFocus = ref(0)
const pomodoroRun = ref<Run>(idle())
const phaseDuration = computed(() => phaseMinutes(phase.value, DEFAULT_POMODORO) * 60_000)
const pomodoroLeft = computed(() => remainingMs(phaseDuration.value, pomodoroRun.value, now.value))
const PHASES: Record<PomodoroPhase, { label: string; icon: typeof Brain }> = {
  focus: { label: 'Foco', icon: Brain },
  'short-break': { label: 'Pausa curta', icon: Coffee },
  'long-break': { label: 'Pausa longa', icon: Coffee },
}

function togglePomodoro() {
  pomodoroRun.value = isRunning(pomodoroRun.value) ? pause(pomodoroRun.value, Date.now()) : start(pomodoroRun.value, Date.now())
}
function resetPomodoro() {
  pomodoroRun.value = idle()
  phase.value = 'focus'
  completedFocus.value = 0
}

// Fim das contagens: avisa e, no pomodoro, passa para a próxima fase e já começa.
watch(now, (current) => {
  if (isRunning(timerRun.value) && remainingMs(timerDuration.value, timerRun.value, current) === 0) {
    timerRun.value = idle()
    timerDuration.value = 0
    finished.value = true
    beep()
    toast.success('O tempo acabou!')
  }
  if (isRunning(pomodoroRun.value) && remainingMs(phaseDuration.value, pomodoroRun.value, current) === 0) {
    if (phase.value === 'focus') completedFocus.value++
    phase.value = nextPhase(phase.value, completedFocus.value, DEFAULT_POMODORO)
    pomodoroRun.value = start(idle(), current)
    beep()
    toast.success(phase.value === 'focus' ? 'Hora de voltar ao foco.' : 'Hora de uma pausa.')
  }
})
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Timer" title="Cronômetro e timer" description="Cronometre voltas, faça uma contagem regressiva com aviso sonoro ou use o método Pomodoro para focar.">
      <FactList>
        <FactTile :icon="Hourglass" label="Modos">3 relógios</FactTile>
        <FactTile :icon="BellRing" label="Fim">Com aviso</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Qual relógio</CardTitle>
        <CardDescription>A contagem segue certa mesmo se você trocar de aba, mas mantenha esta página aberta para ouvir o aviso.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs v-model="tab">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="stopwatch">Cronômetro</TabsTrigger>
            <TabsTrigger value="timer">Timer</TabsTrigger>
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
          </TabsList>

          <TabsContent value="stopwatch" class="mt-6 space-y-6">
            <p class="text-center text-6xl font-semibold tabular-nums sm:text-7xl" role="timer" aria-label="Cronômetro">{{ formatClock(stopwatchMs, true) }}</p>
            <div class="flex flex-wrap justify-center gap-3">
              <Button size="lg" class="min-w-32" @click="toggleStopwatch">
                <Pause v-if="isRunning(stopwatch)" aria-hidden="true" />
                <Play v-else aria-hidden="true" />
                {{ isRunning(stopwatch) ? 'Pausar' : stopwatchMs > 0 ? 'Continuar' : 'Iniciar' }}
              </Button>
              <Button size="lg" variant="outline" :disabled="!isRunning(stopwatch)" @click="lap"><Flag aria-hidden="true" />Volta</Button>
              <Button size="lg" variant="outline" :disabled="stopwatchMs === 0" @click="resetStopwatch"><RotateCcw aria-hidden="true" />Zerar</Button>
            </div>
            <ol v-if="lapRows.length" class="divide-y rounded-xl border bg-card">
              <li v-for="row in lapRows" :key="row.number" class="flex items-baseline justify-between gap-3 px-4 py-2.5 tabular-nums">
                <span class="text-sm text-muted-foreground">Volta {{ row.number }}</span>
                <span class="font-medium">{{ formatClock(row.split, true) }}</span>
                <span class="text-sm text-muted-foreground">{{ formatClock(row.total, true) }}</span>
              </li>
            </ol>
            <EmptyState v-else :icon="Flag" description="As voltas aparecem aqui quando você tocar em Volta." />
          </TabsContent>

          <TabsContent value="timer" class="mt-6 space-y-6">
            <p class="text-center text-6xl font-semibold tabular-nums sm:text-7xl" :class="finished ? 'text-destructive' : ''" role="timer" aria-label="Timer">{{ formatCountdown(timerLeft) }}</p>
            <div class="mx-auto grid max-w-xs grid-cols-2 gap-3">
              <Field>
                <FieldLabel for="minutes">Minutos</FieldLabel>
                <Input id="minutes" v-model="minutesText" v-maska data-maska="###" inputmode="numeric" :disabled="timerActive" class="tabular-nums" />
              </Field>
              <Field>
                <FieldLabel for="seconds">Segundos</FieldLabel>
                <Input id="seconds" v-model="secondsText" v-maska data-maska="##" inputmode="numeric" :disabled="timerActive" class="tabular-nums" />
              </Field>
            </div>
            <div class="flex flex-wrap justify-center gap-2">
              <Button v-for="minutes in PRESETS" :key="minutes" size="sm" variant="outline" class="tabular-nums" @click="usePreset(minutes)">{{ minutes }} min</Button>
            </div>
            <div class="flex flex-wrap justify-center gap-3">
              <Button size="lg" class="min-w-32" :disabled="!timerActive && configuredMs <= 0" @click="toggleTimer">
                <Pause v-if="isRunning(timerRun)" aria-hidden="true" />
                <Play v-else aria-hidden="true" />
                {{ isRunning(timerRun) ? 'Pausar' : timerActive ? 'Continuar' : 'Iniciar' }}
              </Button>
              <Button size="lg" variant="outline" :disabled="!timerActive && !finished" @click="resetTimer"><RotateCcw aria-hidden="true" />Zerar</Button>
            </div>
            <p v-if="finished" role="status" class="text-center font-medium text-destructive">O tempo acabou!</p>
          </TabsContent>

          <TabsContent value="pomodoro" class="mt-6 space-y-6">
            <div class="text-center">
              <p class="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium">
                <component :is="PHASES[phase].icon" class="size-4" aria-hidden="true" />
                {{ PHASES[phase].label }}
              </p>
              <p class="mt-3 text-6xl font-semibold tabular-nums sm:text-7xl" role="timer" aria-label="Pomodoro">{{ formatCountdown(pomodoroLeft) }}</p>
              <p class="mt-2 text-sm text-muted-foreground">{{ completedFocus }} {{ completedFocus === 1 ? 'foco concluído' : 'focos concluídos' }}. Foco de 25 min, pausa de 5 e, a cada 4 focos, pausa de 15.</p>
            </div>
            <div class="flex flex-wrap justify-center gap-3">
              <Button size="lg" class="min-w-32" @click="togglePomodoro">
                <Pause v-if="isRunning(pomodoroRun)" aria-hidden="true" />
                <Play v-else aria-hidden="true" />
                {{ isRunning(pomodoroRun) ? 'Pausar' : pomodoroRun.elapsedBefore > 0 ? 'Continuar' : 'Iniciar' }}
              </Button>
              <Button size="lg" variant="outline" @click="resetPomodoro"><RotateCcw aria-hidden="true" />Zerar</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </section>
</template>
