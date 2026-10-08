<script setup lang="ts">
import { Copy, Pilcrow, RefreshCw, TextQuote, Zap, Languages } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import NumberInput from '@/components/NumberInput.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { generateLorem, type LoremLanguage, type LoremUnit } from './lib/lorem'

const UNITS: ReadonlyArray<{ value: LoremUnit; label: string }> = [
  { value: 'paragraphs', label: 'Parágrafos' },
  { value: 'sentences', label: 'Frases' },
  { value: 'words', label: 'Palavras' },
]

const unit = ref<LoremUnit>('paragraphs')
const count = ref(3)
const language = ref<LoremLanguage>('latin')
const classicStart = ref(true)
const html = ref(false)
/** Muda quando a pessoa pede "gerar outro": força um novo sorteio com as mesmas opções. */
const seed = ref(0)

const text = computed(() => {
  void seed.value
  return generateLorem({ unit: unit.value, count: Number(count.value) || 1, language: language.value, classicStart: classicStart.value, html: html.value })
})

function onUnit(value: unknown) {
  if (value === 'paragraphs' || value === 'sentences' || value === 'words') unit.value = value
}
function onLanguage(value: unknown) {
  if (value === 'latin' || value === 'pt') language.value = value
}

async function copy() {
  try {
    await navigator.clipboard.writeText(text.value)
    toast.success('Texto copiado.')
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="TextQuote" title="Lorem ipsum" description="Gere texto de preenchimento para testar layouts: parágrafos, frases ou palavras, em latim ou em português.">
      <FactList>
        <FactTile :icon="Pilcrow" label="Tamanho">Até 100</FactTile>
        <FactTile :icon="Languages" label="Idiomas">Latim e PT</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Como gerar</CardTitle>
          <CardDescription>O texto muda quando você mexe nas opções.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <Field>
            <FieldLabel for="unit">Unidade</FieldLabel>
            <ToggleGroup id="unit" type="single" variant="outline" :model-value="unit" aria-label="Unidade" class="w-full bg-card" @update:model-value="onUnit">
              <ToggleGroupItem v-for="item in UNITS" :key="item.value" :value="item.value" class="flex-1 px-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{{ item.label }}</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel for="count">Quantidade</FieldLabel>
              <FieldDescription>De 1 a 100.</FieldDescription>
            </FieldContent>
            <NumberInput id="count" v-model="count" :min="1" :max="100" />
          </Field>
          <Field>
            <FieldLabel for="language">Idioma</FieldLabel>
            <ToggleGroup id="language" type="single" variant="outline" :model-value="language" aria-label="Idioma" class="w-full bg-card" @update:model-value="onLanguage">
              <ToggleGroupItem value="latin" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Latim</ToggleGroupItem>
              <ToggleGroupItem value="pt" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Português</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field v-if="language === 'latin'" orientation="horizontal">
            <FieldContent>
              <FieldLabel for="classic">Começar com "Lorem ipsum"</FieldLabel>
              <FieldDescription>A frase clássica no início.</FieldDescription>
            </FieldContent>
            <Switch id="classic" v-model="classicStart" />
          </Field>
          <Field v-if="unit === 'paragraphs'" orientation="horizontal">
            <FieldContent>
              <FieldLabel for="html">Em HTML</FieldLabel>
              <FieldDescription>Cada parágrafo dentro de uma tag p.</FieldDescription>
            </FieldContent>
            <Switch id="html" v-model="html" />
          </Field>
          <Button size="lg" class="w-full" @click="seed++">
            <RefreshCw aria-hidden="true" />
            Gerar outro texto
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Texto</CardTitle>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel for="output" class="sr-only">Texto gerado</FieldLabel>
            <InputGroup class="bg-card">
              <InputGroupTextarea id="output" :model-value="text" readonly class="h-64 min-h-0 flex-none resize-none overflow-y-auto text-base field-sizing-fixed lg:h-[26rem]" @focus="($event.target as HTMLTextAreaElement).select()" />
              <InputGroupAddon align="block-end" class="justify-end border-t">
                <Button type="button" variant="ghost" size="sm" class="h-9" @click="copy">
                  <Copy aria-hidden="true" />
                  Copiar
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
