<script setup lang="ts">
import { Copy, Hash, ReceiptText, TextCursorInput, Zap } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseMoney } from '@/lib/money'
import { MAX_NUMBER, moneyToWords, numberToWords } from './lib/words'

const mode = ref<'money' | 'number'>('money')
const money = ref('')
const digits = ref('')
const uppercase = ref(false)

/** Resultado ou erro; `null` enquanto não há nada digitado. */
const outcome = computed<{ text: string } | { error: string } | null>(() => {
  try {
    if (mode.value === 'money') {
      const value = parseMoney(money.value)
      return value === null ? null : { text: moneyToWords(Math.round(value * 100)) }
    }
    return digits.value === '' ? null : { text: numberToWords(Number(digits.value)) }
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Valor inválido.' }
  }
})
const text = computed(() => {
  if (!outcome.value || !('text' in outcome.value)) return ''
  return uppercase.value ? outcome.value.text.toLocaleUpperCase('pt-BR') : outcome.value.text
})
const error = computed(() => (outcome.value && 'error' in outcome.value ? outcome.value.error : ''))

function onMode(value: unknown) {
  if (value === 'money' || value === 'number') mode.value = value
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
    <PageHeader filled :icon="ReceiptText" title="Valor por extenso" description="Escreva um valor em reais ou um número por extenso, pronto para recibo, cheque e contrato.">
      <FactList>
        <FactTile :icon="Hash" label="Até">999 bilhões</FactTile>
        <FactTile :icon="TextCursorInput" label="Texto">Em português</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">O valor</CardTitle>
          <CardDescription>O texto aparece enquanto você digita.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <Tabs :model-value="mode" @update:model-value="onMode">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="money">Em reais</TabsTrigger>
              <TabsTrigger value="number">Número</TabsTrigger>
            </TabsList>
          </Tabs>
          <Field v-if="mode === 'money'">
            <FieldLabel for="money">Valor</FieldLabel>
            <Input id="money" v-model="money" v-money placeholder="R$ 1.234,56" inputmode="numeric" autocomplete="off" class="tabular-nums" />
          </Field>
          <Field v-else>
            <FieldLabel for="digits">Número inteiro</FieldLabel>
            <Input id="digits" v-model="digits" v-maska data-maska="############" inputmode="numeric" autocomplete="off" placeholder="1234" class="tabular-nums" :aria-invalid="digits && Number(digits) > MAX_NUMBER ? true : undefined" />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel for="uppercase">Em maiúsculas</FieldLabel>
              <FieldDescription>Como se escreve em cheques.</FieldDescription>
            </FieldContent>
            <Switch id="uppercase" v-model="uppercase" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Por extenso</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert v-if="error" variant="destructive" role="alert">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
          <Field v-else-if="text">
            <FieldLabel for="output" class="sr-only">Valor por extenso</FieldLabel>
            <InputGroup class="bg-card">
              <InputGroupTextarea id="output" :model-value="text" readonly class="h-32 min-h-0 flex-none resize-none overflow-y-auto text-lg field-sizing-fixed" @focus="($event.target as HTMLTextAreaElement).select()" />
              <InputGroupAddon align="block-end" class="justify-end border-t">
                <Button type="button" variant="ghost" size="sm" class="h-9" @click="copy">
                  <Copy aria-hidden="true" />
                  Copiar
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </Field>
          <EmptyState v-else :icon="ReceiptText" description="Digite um valor para ver o texto." />
        </CardContent>
      </Card>
    </div>
  </section>
</template>
