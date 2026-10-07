<script setup lang="ts">
import { Check, Copy, IdCard, RefreshCw, ShieldCheck, Sparkles, Zap } from '@lucide/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import { toast } from 'vue-sonner'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { COPIED_FEEDBACK_MS, DOCUMENT_TYPES, QUANTITIES } from './constants'
import { useDocumentGenerator } from './composables/useDocumentGenerator'

const { type, quantity, formatted, items, generate } = useDocumentGenerator()

const selected = computed(() => DOCUMENT_TYPES.find((option) => option.value === type.value))
const typeLabel = computed(() => selected.value?.label ?? '')
/** "CPF gerado", "5 CNPJs alfanuméricos gerados". */
const summary = computed(() =>
  items.value.length === 1 ? `${typeLabel.value} gerado` : `${items.value.length} ${selected.value?.plural ?? ''} gerados`,
)

/** Qual botão acabou de copiar: o índice do número, "all" para todos, ou nenhum. */
const copied = ref<number | 'all' | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy(text: string, which: number | 'all', message: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = which
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = null), COPIED_FEEDBACK_MS)
    toast.success(message)
  } catch {
    toast.error('Não foi possível copiar. Selecione o número e copie manualmente.')
  }
}

/** O ToggleGroup devolve vazio ao clicar no item já ativo; nesse caso mantém a quantidade. */
function onQuantity(value: unknown) {
  const amount = Number(value)
  if ((QUANTITIES as readonly number[]).includes(amount)) quantity.value = amount
}

onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="IdCard" title="Gerador de CPF e CNPJ" description="Escolha o tipo e gere números válidos para testar formulários e sistemas.">
      <FactList>
        <FactTile :icon="ShieldCheck" label="Dígitos">Válidos</FactTile>
        <FactTile :icon="Sparkles" label="Novo formato">Com letras</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">O que gerar</CardTitle>
          <CardDescription>Ao trocar o tipo ou a quantidade, os números já são gerados de novo.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <fieldset class="space-y-2">
              <legend class="mb-2 text-sm font-medium">Tipo</legend>
              <label
                v-for="option in DOCUMENT_TYPES"
                :key="option.value"
                class="group flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 motion-reduce:transition-none"
              >
                <input v-model="type" type="radio" name="document-type" :value="option.value" class="sr-only" />
                <span class="flex size-5 shrink-0 items-center justify-center rounded-full border border-input bg-background group-has-[:checked]:border-primary" aria-hidden="true">
                  <span class="size-2.5 scale-0 rounded-full bg-primary transition-transform group-has-[:checked]:scale-100 motion-reduce:transition-none" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block font-semibold">{{ option.label }}</span>
                  <span class="block text-sm text-muted-foreground">{{ option.description }}</span>
                </span>
              </label>
            </fieldset>

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel for="quantity">Quantidade</FieldLabel>
                <FieldDescription>Quantos números de uma vez.</FieldDescription>
              </FieldContent>
              <ToggleGroup id="quantity" type="single" variant="outline" :model-value="String(quantity)" aria-label="Quantidade" class="bg-card" @update:model-value="onQuantity">
                <ToggleGroupItem v-for="amount in QUANTITIES" :key="amount" :value="String(amount)" class="min-w-11 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{{ amount }}</ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel for="formatted">Com pontuação</FieldLabel>
                <FieldDescription>Pontos, barra e traço no número.</FieldDescription>
              </FieldContent>
              <Switch id="formatted" v-model="formatted" />
            </Field>

            <Button size="lg" class="w-full" @click="generate">
              <RefreshCw aria-hidden="true" />
              {{ quantity === 1 ? 'Gerar outro' : 'Gerar outros' }}
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Resultado</CardTitle>
          <CardDescription>{{ summary }}</CardDescription>
          <CardAction v-if="items.length > 1">
            <Button variant="outline" size="sm" @click="copy(items.join('\n'), 'all', 'Todos os números copiados.')">
              <Check v-if="copied === 'all'" aria-hidden="true" />
              <Copy v-else aria-hidden="true" />
              {{ copied === 'all' ? 'Copiados' : 'Copiar todos' }}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p class="sr-only" role="status">{{ items.length }} {{ items.length === 1 ? 'número gerado' : 'números gerados' }}.</p>
          <ul class="space-y-2">
            <li v-for="(item, index) in items" :key="`${index}-${item}`" class="flex items-center gap-3 rounded-xl border bg-card p-3">
              <span class="min-w-0 flex-1 whitespace-nowrap font-mono font-semibold tabular-nums" :class="items.length === 1 ? 'text-base min-[400px]:text-xl sm:text-3xl' : 'text-base sm:text-xl'">{{ item }}</span>
              <Button variant="ghost" size="icon" :aria-label="`Copiar ${item}`" @click="copy(item, index, `${typeLabel} copiado.`)">
                <Check v-if="copied === index" aria-hidden="true" />
                <Copy v-else aria-hidden="true" />
              </Button>
            </li>
          </ul>
          <p class="mt-4 text-sm text-muted-foreground">Os números passam na conta dos dígitos verificadores, mas não pertencem a ninguém. Use só para testes.</p>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
