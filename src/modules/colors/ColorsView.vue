<script setup lang="ts">
import { CircleCheck, CircleX, Contrast, Palette, Pipette, SwatchBook, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import CopyField from '@/components/CopyField.vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { parseColor, readableOn, shades, toHex, toHslString, toRgbString, wcag, type Rgb } from './lib/color'

const text = ref('#2F5BEA')
const color = computed(() => parseColor(text.value))
const hex = computed(() => (color.value ? toHex(color.value) : '#000000'))

/** O seletor nativo só devolve #rrggbb; escrever nele troca o texto. */
function onPick(event: Event) {
  text.value = (event.target as HTMLInputElement).value.toUpperCase()
}

const formats = computed(() =>
  color.value
    ? [
        { label: 'HEX', value: toHex(color.value) },
        { label: 'RGB', value: toRgbString(color.value) },
        { label: 'HSL', value: toHslString(color.value) },
      ]
    : [],
)
const palette = computed(() => (color.value ? shades(color.value).map((shade) => ({ hex: toHex(shade), text: toHex(readableOn(shade)) })) : []))

const foregroundText = ref('#FFFFFF')
const backgroundText = ref('#2F5BEA')
const foreground = computed(() => parseColor(foregroundText.value))
const background = computed(() => parseColor(backgroundText.value))
const contrast = computed(() => (foreground.value && background.value ? wcag(foreground.value, background.value) : null))
const levels = computed(() =>
  contrast.value
    ? [
        { label: 'AA, texto normal', ok: contrast.value.aa, need: '4,5' },
        { label: 'AA, texto grande', ok: contrast.value.aaLarge, need: '3' },
        { label: 'AAA, texto normal', ok: contrast.value.aaa, need: '7' },
        { label: 'AAA, texto grande', ok: contrast.value.aaaLarge, need: '4,5' },
      ]
    : [],
)
const css = (rgb: Rgb | null, fallback: string) => (rgb ? toHex(rgb) : fallback)
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Palette" title="Cores" description="Escolha uma cor, copie em HEX, RGB ou HSL e confira se o contraste do texto passa nas regras de acessibilidade.">
      <FactList>
        <FactTile :icon="Pipette" label="Formatos">HEX, RGB, HSL</FactTile>
        <FactTile :icon="Contrast" label="Contraste">WCAG</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Escolher e converter</CardTitle>
          <CardDescription>Use o seletor ou digite: #2F5BEA, rgb(47, 91, 234) ou hsl(224, 82%, 56%).</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div class="flex items-end gap-3">
            <Field class="flex-1">
              <FieldLabel for="color-text">Cor</FieldLabel>
              <Input id="color-text" v-model="text" autocomplete="off" spellcheck="false" class="tabular-nums" :aria-invalid="text && !color ? true : undefined" />
            </Field>
            <input type="color" :value="hex" aria-label="Seletor de cor" class="h-9 w-14 shrink-0 cursor-pointer rounded-lg border bg-card p-1" @input="onPick" />
          </div>
          <template v-if="color">
            <div class="flex h-24 items-center justify-center rounded-xl border text-lg font-semibold tabular-nums" :style="{ backgroundColor: hex, color: toHex(readableOn(color)) }">{{ hex }}</div>
            <ul class="space-y-2">
              <li v-for="format in formats" :key="format.label" class="flex items-center gap-3">
                <span class="w-10 shrink-0 text-sm font-medium text-muted-foreground">{{ format.label }}</span>
                <CopyField :value="format.value" :label="format.label" :message="`${format.label} copiado.`" class="flex-1 tabular-nums" />
              </li>
            </ul>
            <div>
              <h3 class="mb-2 flex items-center gap-1.5 text-sm font-medium"><SwatchBook class="size-4" aria-hidden="true" />Tons da mesma cor</h3>
              <ul class="grid grid-cols-9 overflow-hidden rounded-lg border">
                <li v-for="shade in palette" :key="shade.hex" class="flex h-12 items-end justify-center pb-1 text-[10px] font-semibold tabular-nums" :style="{ backgroundColor: shade.hex, color: shade.text }" :title="shade.hex" />
              </ul>
            </div>
          </template>
          <EmptyState v-else :icon="Palette" description="Esse texto não é uma cor. Tente algo como #2F5BEA." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Contraste do texto</CardTitle>
          <CardDescription>Quanto maior a razão, mais fácil de ler. Para texto normal, o mínimo é 4,5.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div class="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel for="foreground">Texto</FieldLabel>
              <Input id="foreground" v-model="foregroundText" autocomplete="off" spellcheck="false" class="tabular-nums" :aria-invalid="foregroundText && !foreground ? true : undefined" />
            </Field>
            <Field>
              <FieldLabel for="background">Fundo</FieldLabel>
              <Input id="background" v-model="backgroundText" autocomplete="off" spellcheck="false" class="tabular-nums" :aria-invalid="backgroundText && !background ? true : undefined" />
            </Field>
          </div>
          <template v-if="contrast">
            <div class="rounded-xl border p-5" :style="{ backgroundColor: css(background, '#fff'), color: css(foreground, '#000') }">
              <p class="text-2xl font-semibold">Texto grande</p>
              <p class="mt-1 text-base">Assim fica o texto normal sobre este fundo.</p>
            </div>
            <p role="status" class="text-3xl font-semibold tabular-nums">{{ contrast.ratio.toFixed(2).replace('.', ',') }}<span class="text-lg text-muted-foreground"> : 1</span></p>
            <ul class="grid gap-2 sm:grid-cols-2">
              <li v-for="level in levels" :key="level.label" class="flex items-center gap-2 rounded-xl border bg-card p-3 text-sm">
                <CircleCheck v-if="level.ok" class="size-4 shrink-0 text-success" aria-hidden="true" />
                <CircleX v-else class="size-4 shrink-0 text-destructive" aria-hidden="true" />
                <span class="min-w-0 flex-1">{{ level.label }}</span>
                <span class="font-medium" :class="level.ok ? 'text-success' : 'text-destructive'">{{ level.ok ? 'Passa' : `Pede ${level.need}` }}</span>
              </li>
            </ul>
          </template>
          <EmptyState v-else :icon="Contrast" description="Informe duas cores válidas para ver o contraste." />
        </CardContent>
      </Card>
    </div>
  </section>
</template>
