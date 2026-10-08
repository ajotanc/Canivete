<script setup lang="ts">
import { Clock, Eraser, Gauge, Mic, Type, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { CHARACTER_LIMITS } from './constants'
import { countText, formatDuration } from './lib/count'

const text = ref('')
const stats = computed(() => countText(text.value))

const rows = computed(() => [
  { label: 'Caracteres', value: stats.value.characters, strong: true },
  { label: 'Sem espaços', value: stats.value.charactersNoSpaces },
  { label: 'Palavras', value: stats.value.words, strong: true },
  { label: 'Frases', value: stats.value.sentences },
  { label: 'Parágrafos', value: stats.value.paragraphs },
  { label: 'Linhas', value: stats.value.lines },
])

const limits = computed(() =>
  CHARACTER_LIMITS.map((limit) => {
    const used = stats.value.characters
    return { ...limit, used, over: used > limit.max, percent: Math.min(100, Math.round((used / limit.max) * 100)), left: limit.max - used }
  }),
)
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Type" title="Contador de texto" description="Cole ou escreva um texto e veja na hora quantos caracteres, palavras e frases ele tem, e se cabe nos limites das redes.">
      <FactList>
        <FactTile :icon="Gauge" label="Contagem">Ao vivo</FactTile>
        <FactTile :icon="Clock" label="Leitura">Estimada</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Seu texto</CardTitle>
          <CardDescription>O texto fica só no seu aparelho; nada é enviado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel for="text" class="sr-only">Texto para contar</FieldLabel>
            <InputGroup class="bg-card">
              <InputGroupTextarea id="text" v-model="text" placeholder="Escreva ou cole aqui…" class="h-48 min-h-0 flex-none resize-none overflow-y-auto text-base field-sizing-fixed lg:h-[28rem]" />
              <InputGroupAddon align="block-end" class="justify-between border-t">
                <span class="whitespace-nowrap text-sm tabular-nums text-muted-foreground" role="status">{{ stats.characters }} {{ stats.characters === 1 ? 'caractere' : 'caracteres' }}</span>
                <Button type="button" variant="ghost" size="sm" class="h-9" :disabled="!text" @click="text = ''">
                  <Eraser aria-hidden="true" />
                  Limpar
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </CardContent>
      </Card>

      <div class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Contagem</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <dl class="divide-y">
              <div v-for="row in rows" :key="row.label" class="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0">
                <dt class="text-sm text-muted-foreground">{{ row.label }}</dt>
                <dd class="tabular-nums" :class="row.strong ? 'font-semibold' : 'font-medium'">{{ row.value }}</dd>
              </div>
            </dl>
            <div class="grid grid-cols-2 gap-2">
              <div class="rounded-xl border bg-card p-3">
                <p class="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock class="size-3.5" aria-hidden="true" />Leitura</p>
                <p class="mt-1 font-semibold tabular-nums">{{ formatDuration(stats.readingSeconds) }}</p>
              </div>
              <div class="rounded-xl border bg-card p-3">
                <p class="flex items-center gap-1.5 text-xs text-muted-foreground"><Mic class="size-3.5" aria-hidden="true" />Fala</p>
                <p class="mt-1 font-semibold tabular-nums">{{ formatDuration(stats.speakingSeconds) }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Limites</CardTitle>
            <CardDescription>Quanto do limite o texto usa em cada lugar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul class="space-y-4">
              <li v-for="limit in limits" :key="limit.id" class="space-y-1.5">
                <div class="flex items-baseline justify-between gap-3 text-sm">
                  <span class="font-medium">{{ limit.label }}</span>
                  <span class="tabular-nums" :class="limit.over ? 'font-semibold text-destructive' : 'text-muted-foreground'">
                    {{ limit.over ? `${-limit.left} a mais` : `${limit.used} / ${limit.max}` }}
                  </span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" :aria-label="limit.label" :aria-valuemin="0" :aria-valuemax="limit.max" :aria-valuenow="Math.min(limit.used, limit.max)">
                  <div class="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none" :class="limit.over ? 'bg-destructive' : 'bg-primary'" :style="{ width: `${limit.percent}%` }" />
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>
