<script setup lang="ts">
import { ArrowLeftRight, CircleAlert, Copy, Eraser, FileDiff, Minus, Plus, Zap, Equal } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import { diffText, toUnified, type DiffResult, type Row } from './lib/diff'

const original = ref('')
const changed = ref('')
const ignoreCase = ref(false)
const ignoreSpaces = ref(false)
const showEqual = ref(true)

/** Resultado ou erro de tamanho; `null` enquanto os dois lados estão vazios. */
const outcome = computed<{ diff: DiffResult } | { error: string } | null>(() => {
  if (!original.value && !changed.value) return null
  try {
    return { diff: diffText(original.value, changed.value, { ignoreCase: ignoreCase.value, ignoreSpaces: ignoreSpaces.value }) }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Não foi possível comparar.' }
  }
})
const diff = computed(() => (outcome.value && 'diff' in outcome.value ? outcome.value.diff : null))
const error = computed(() => (outcome.value && 'error' in outcome.value ? outcome.value.error : ''))
const identical = computed(() => diff.value !== null && diff.value.added === 0 && diff.value.removed === 0)
const rows = computed(() => (diff.value ? diff.value.rows.filter((row) => showEqual.value || row.type !== 'equal') : []))

const ROW_STYLE: Record<Row['type'], string> = {
  equal: '',
  add: 'bg-success/10',
  remove: 'bg-destructive/10',
}
const MARK_STYLE: Record<Row['type'], string> = {
  equal: '',
  add: 'bg-success/30 rounded-sm',
  remove: 'bg-destructive/30 rounded-sm',
}
const SIGN: Record<Row['type'], string> = { equal: ' ', add: '+', remove: '−' }

function swap() {
  ;[original.value, changed.value] = [changed.value, original.value]
}

async function copy() {
  if (!diff.value) return
  try {
    await navigator.clipboard.writeText(toUnified(diff.value.rows))
    toast.success('Diferenças copiadas.')
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="FileDiff" title="Comparador de texto" description="Cole duas versões de um texto e veja o que foi acrescentado, removido ou trocado, linha a linha e palavra a palavra.">
      <FactList>
        <FactTile :icon="Plus" label="Mostra">O que mudou</FactTile>
        <FactTile :icon="ArrowLeftRight" label="Detalhe">Por palavra</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Fica no aparelho</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Original</CardTitle>
          <CardDescription>A versão de antes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel for="original" class="sr-only">Texto original</FieldLabel>
            <InputGroup class="bg-card">
              <InputGroupTextarea id="original" v-model="original" spellcheck="false" placeholder="Cole o texto original…" class="h-48 min-h-0 flex-none resize-none overflow-y-auto text-base field-sizing-fixed" />
            </InputGroup>
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Novo</CardTitle>
          <CardDescription>A versão de agora.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel for="changed" class="sr-only">Texto novo</FieldLabel>
            <InputGroup class="bg-card">
              <InputGroupTextarea id="changed" v-model="changed" spellcheck="false" placeholder="Cole o texto novo…" class="h-48 min-h-0 flex-none resize-none overflow-y-auto text-base field-sizing-fixed" />
            </InputGroup>
          </Field>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle class="text-lg">Diferenças</CardTitle>
        <CardDescription>Escolha como comparar; o resultado muda na hora.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <div class="flex flex-wrap items-center gap-x-8 gap-y-3">
          <label class="flex items-center gap-3 text-sm font-medium"><Switch v-model="ignoreCase" />Ignorar maiúsculas</label>
          <label class="flex items-center gap-3 text-sm font-medium"><Switch v-model="ignoreSpaces" />Ignorar espaços sobrando</label>
          <label class="flex items-center gap-3 text-sm font-medium"><Switch v-model="showEqual" />Mostrar linhas iguais</label>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" :disabled="!original && !changed" @click="swap"><ArrowLeftRight aria-hidden="true" />Trocar os lados</Button>
          <Button type="button" variant="outline" size="sm" :disabled="!original && !changed" @click="((original = ''), (changed = ''))"><Eraser aria-hidden="true" />Limpar</Button>
          <Button type="button" variant="outline" size="sm" :disabled="!diff || identical" @click="copy"><Copy aria-hidden="true" />Copiar diferenças</Button>
        </div>

        <Alert v-if="error" variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
        <template v-else-if="diff">
          <div class="flex flex-wrap gap-2" role="status">
            <Badge variant="success" class="tabular-nums"><Plus aria-hidden="true" />{{ diff.added }} {{ diff.added === 1 ? 'linha nova' : 'linhas novas' }}</Badge>
            <Badge variant="danger" class="tabular-nums"><Minus aria-hidden="true" />{{ diff.removed }} {{ diff.removed === 1 ? 'removida' : 'removidas' }}</Badge>
            <Badge variant="secondary" class="tabular-nums"><Equal aria-hidden="true" />{{ diff.equal }} {{ diff.equal === 1 ? 'igual' : 'iguais' }}</Badge>
          </div>
          <Alert v-if="identical" variant="success">
            <AlertDescription>Os dois textos são iguais{{ ignoreCase || ignoreSpaces ? ' com as opções escolhidas' : '' }}.</AlertDescription>
          </Alert>
          <ol v-if="rows.length" class="overflow-hidden rounded-xl border bg-card text-sm">
            <li v-for="(row, index) in rows" :key="index" class="grid grid-cols-[2.25rem_2.25rem_1.25rem_1fr] items-baseline gap-x-1 border-b px-2 py-1 last:border-b-0 sm:grid-cols-[3rem_3rem_1.5rem_1fr]" :class="ROW_STYLE[row.type]">
              <span class="text-right text-xs tabular-nums text-muted-foreground" aria-hidden="true">{{ row.oldNumber ?? '' }}</span>
              <span class="text-right text-xs tabular-nums text-muted-foreground" aria-hidden="true">{{ row.newNumber ?? '' }}</span>
              <span class="text-center font-semibold" :class="row.type === 'add' ? 'text-success' : row.type === 'remove' ? 'text-destructive' : 'text-muted-foreground'">
                <span aria-hidden="true">{{ SIGN[row.type] }}</span>
                <span class="sr-only">{{ row.type === 'add' ? 'Acrescentada:' : row.type === 'remove' ? 'Removida:' : 'Igual:' }}</span>
              </span>
              <span class="min-w-0 whitespace-pre-wrap break-words">
                <template v-if="row.parts"><span v-for="(part, partIndex) in row.parts" :key="partIndex" :class="part.changed ? MARK_STYLE[row.type] : ''">{{ part.text }}</span></template>
                <template v-else>{{ row.text || ' ' }}</template>
              </span>
            </li>
          </ol>
        </template>
        <EmptyState v-else :icon="FileDiff" description="Cole os dois textos para ver as diferenças." />
      </CardContent>
    </Card>
  </section>
</template>
