<script setup lang="ts">
import { ArrowDownAZ, Braces, CircleAlert, CircleCheck, Eraser, FileJson, Minimize2, Zap, AlignLeft } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatJson, minifyJson, parseJson, sortKeys, statsOf, type Indent } from './lib/json'

const text = ref('')
const indent = ref<'2' | '4' | 'tab'>('2')
const parsed = computed(() => (text.value.trim() ? parseJson(text.value) : null))
const stats = computed(() => (parsed.value?.ok ? statsOf(parsed.value.value) : null))

const indentValue = (): Indent => (indent.value === 'tab' ? 'tab' : (Number(indent.value) as 2 | 4))

function format() {
  if (parsed.value?.ok) text.value = formatJson(parsed.value.value, indentValue())
}
function minify() {
  if (parsed.value?.ok) text.value = minifyJson(parsed.value.value)
}
function sort() {
  if (parsed.value?.ok) text.value = formatJson(sortKeys(parsed.value.value), indentValue())
}
async function copy() {
  try {
    await navigator.clipboard.writeText(text.value)
    toast.success('JSON copiado.')
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}
function onIndent(value: unknown) {
  if (value === '2' || value === '4' || value === 'tab') indent.value = value
}

const formatBytes = (bytes: number) => (bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1).replace('.', ',')} kB`)
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="FileJson" title="Formatador de JSON" description="Cole um JSON para validar, deixar legível, compactar ou ordenar as chaves, com o erro apontado na linha certa.">
      <FactList>
        <FactTile :icon="CircleCheck" label="Valida">Na hora</FactTile>
        <FactTile :icon="Braces" label="Ações">Formata e ordena</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Seu JSON</CardTitle>
          <CardDescription>O texto fica só no seu aparelho; nada é enviado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel for="json" class="sr-only">JSON</FieldLabel>
            <InputGroup class="bg-card">
              <InputGroupTextarea id="json" v-model="text" spellcheck="false" autocapitalize="off" placeholder='{"nome": "Canivete"}' class="h-64 min-h-0 flex-none resize-none overflow-auto whitespace-pre text-sm field-sizing-fixed lg:h-[28rem]" :aria-invalid="parsed && !parsed.ok ? true : undefined" />
              <InputGroupAddon align="block-end" class="justify-between border-t">
                <span class="min-w-0 truncate text-sm" role="status" :class="parsed ? (parsed.ok ? 'font-medium text-success' : 'font-medium text-destructive') : 'text-muted-foreground'">
                  <template v-if="parsed?.ok">JSON válido</template>
                  <template v-else-if="parsed">Linha {{ parsed.line }}, coluna {{ parsed.column }}</template>
                  <template v-else>Cole ou escreva um JSON</template>
                </span>
                <Button type="button" variant="ghost" size="sm" class="h-9" :disabled="!text" @click="text = ''">
                  <Eraser aria-hidden="true" />
                  Limpar
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <p v-if="parsed && !parsed.ok" role="alert" class="mt-3 flex items-start gap-2 text-sm font-medium text-destructive">
            <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {{ parsed.message }}
          </p>
        </CardContent>
      </Card>

      <div class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Ações</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="space-y-2">
              <p class="text-sm font-medium">Recuo</p>
              <ToggleGroup type="single" variant="outline" :model-value="indent" aria-label="Recuo" class="w-full bg-card" @update:model-value="onIndent">
                <ToggleGroupItem value="2" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">2 espaços</ToggleGroupItem>
                <ToggleGroupItem value="4" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">4 espaços</ToggleGroupItem>
                <ToggleGroupItem value="tab" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Tab</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Button class="w-full" :disabled="!parsed?.ok" @click="format"><AlignLeft aria-hidden="true" />Formatar</Button>
            <Button variant="outline" class="w-full" :disabled="!parsed?.ok" @click="minify"><Minimize2 aria-hidden="true" />Compactar</Button>
            <Button variant="outline" class="w-full" :disabled="!parsed?.ok" @click="sort"><ArrowDownAZ aria-hidden="true" />Ordenar chaves</Button>
            <Button variant="outline" class="w-full" :disabled="!text" @click="copy">Copiar</Button>
          </CardContent>
        </Card>

        <Card v-if="stats">
          <CardHeader>
            <CardTitle class="text-lg">Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="divide-y">
              <div class="flex items-baseline justify-between py-2.5 first:pt-0"><dt class="text-sm text-muted-foreground">Tipo</dt><dd class="font-medium capitalize">{{ stats.type }}</dd></div>
              <div class="flex items-baseline justify-between py-2.5"><dt class="text-sm text-muted-foreground">Chaves</dt><dd class="font-medium tabular-nums">{{ stats.keys }}</dd></div>
              <div class="flex items-baseline justify-between py-2.5"><dt class="text-sm text-muted-foreground">Profundidade</dt><dd class="font-medium tabular-nums">{{ stats.depth }}</dd></div>
              <div class="flex items-baseline justify-between py-2.5 last:pb-0"><dt class="text-sm text-muted-foreground">Compactado</dt><dd class="font-medium tabular-nums">{{ formatBytes(stats.bytes) }}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>
