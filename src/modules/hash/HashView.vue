<script setup lang="ts">
import { CircleAlert, Fingerprint, Hash, KeyRound, RefreshCw, Zap } from '@lucide/vue'
import { ref, watch } from 'vue'
import CopyField from '@/components/CopyField.vue'
import EmptyState from '@/components/EmptyState.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { digestHex, generateUuid, HASH_ALGORITHMS, hmacHex, type UuidVersion } from './lib/hash'

const tab = ref('uuid')

// UUID
const QUANTITIES = [1, 5, 10] as const
const version = ref<UuidVersion>('v4')
const quantity = ref<number>(QUANTITIES[0])
const uppercase = ref(false)
const dashes = ref(true)
const uuids = ref<string[]>([])

function generate() {
  uuids.value = Array.from({ length: quantity.value }, () => generateUuid({ version: version.value, uppercase: uppercase.value, dashes: dashes.value }))
}
watch([version, quantity, uppercase, dashes], generate, { immediate: true, flush: 'sync' })

function onVersion(value: unknown) {
  if (value === 'v4' || value === 'v7') version.value = value
}
function onQuantity(value: unknown) {
  const amount = Number(value)
  if ((QUANTITIES as readonly number[]).includes(amount)) quantity.value = amount
}

// Hash
const text = ref('')
const useKey = ref(false)
const key = ref('')
const hashes = ref<Array<{ algorithm: string; value: string }>>([])
const hashError = ref('')

/** Só o resultado da última digitação vale: respostas atrasadas de textos antigos são descartadas. */
let run = 0
watch(
  [text, useKey, key],
  async () => {
    const current = ++run
    if (!text.value) {
      hashes.value = []
      hashError.value = ''
      return
    }
    try {
      const values = await Promise.all(
        HASH_ALGORITHMS.map(async (algorithm) => ({
          algorithm,
          value: useKey.value && key.value ? await hmacHex(algorithm, key.value, text.value) : await digestHex(algorithm, text.value),
        })),
      )
      if (current !== run) return
      hashes.value = values
      hashError.value = ''
    } catch {
      if (current !== run) return
      hashes.value = []
      hashError.value = 'Este navegador não calcula hashes nesta página. Abra o site por HTTPS.'
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Fingerprint" title="UUID e hash" description="Gere UUIDs v4 e v7 e calcule SHA-1, SHA-256, SHA-384 e SHA-512 (ou HMAC) de qualquer texto.">
      <FactList>
        <FactTile :icon="Hash" label="SHA e HMAC">Calcula</FactTile>
        <FactTile :icon="KeyRound" label="Texto">Fica aqui</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <Card>
      <CardHeader>
        <CardTitle class="text-lg">O que gerar</CardTitle>
        <CardDescription>O texto e a chave não saem do seu aparelho.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs v-model="tab">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="uuid">UUID</TabsTrigger>
            <TabsTrigger value="hash">Hash</TabsTrigger>
          </TabsList>

          <TabsContent value="uuid" class="mt-5 space-y-5">
            <div class="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel for="version">Versão</FieldLabel>
                <ToggleGroup id="version" type="single" variant="outline" :model-value="version" aria-label="Versão" class="w-full bg-card" @update:model-value="onVersion">
                  <ToggleGroupItem value="v4" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">v4 aleatório</ToggleGroupItem>
                  <ToggleGroupItem value="v7" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">v7 por data</ToggleGroupItem>
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel for="quantity">Quantidade</FieldLabel>
                <ToggleGroup id="quantity" type="single" variant="outline" :model-value="String(quantity)" aria-label="Quantidade" class="w-full bg-card" @update:model-value="onQuantity">
                  <ToggleGroupItem v-for="amount in QUANTITIES" :key="amount" :value="String(amount)" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{{ amount }}</ToggleGroupItem>
                </ToggleGroup>
              </Field>
            </div>
            <div class="flex flex-wrap gap-x-8 gap-y-3">
              <label class="flex items-center gap-3 text-sm font-medium"><Switch v-model="uppercase" />Maiúsculas</label>
              <label class="flex items-center gap-3 text-sm font-medium"><Switch v-model="dashes" />Com traços</label>
            </div>
            <Button size="lg" class="w-full sm:w-auto" @click="generate">
              <RefreshCw aria-hidden="true" />
              {{ quantity === 1 ? 'Gerar outro' : 'Gerar outros' }}
            </Button>
            <ul class="space-y-2" aria-live="polite">
              <li v-for="(uuid, index) in uuids" :key="`${index}-${uuid}`">
                <CopyField :value="uuid" label="UUID" message="UUID copiado." input-class="text-base" class="tabular-nums" />
              </li>
            </ul>
            <p class="text-sm text-muted-foreground">A v7 começa com a data e a hora, então ordena por criação (bom para chaves de banco). A v4 é só aleatória.</p>
          </TabsContent>

          <TabsContent value="hash" class="mt-5 space-y-5">
            <Field>
              <FieldLabel for="hash-text">Texto</FieldLabel>
              <InputGroup class="bg-card">
                <InputGroupTextarea id="hash-text" v-model="text" spellcheck="false" placeholder="Escreva ou cole o texto" class="h-32 min-h-0 flex-none resize-none overflow-y-auto text-base field-sizing-fixed" />
              </InputGroup>
            </Field>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel for="use-key">Usar chave (HMAC)</FieldLabel>
                <FieldDescription>Assina o texto com uma chave secreta.</FieldDescription>
              </FieldContent>
              <Switch id="use-key" v-model="useKey" />
            </Field>
            <Field v-if="useKey">
              <FieldLabel for="hash-key">Chave</FieldLabel>
              <Input id="hash-key" v-model="key" autocomplete="off" spellcheck="false" />
            </Field>
            <Alert v-if="hashError" variant="destructive">
              <CircleAlert aria-hidden="true" />
              <AlertDescription>{{ hashError }}</AlertDescription>
            </Alert>
            <ul v-else-if="hashes.length" class="space-y-3" aria-live="polite">
              <li v-for="item in hashes" :key="item.algorithm" class="space-y-1.5">
                <p class="text-sm font-medium">{{ useKey && key ? `HMAC-${item.algorithm}` : item.algorithm }}</p>
                <CopyField :value="item.value" :label="item.algorithm" :message="`${item.algorithm} copiado.`" input-class="text-xs" class="tabular-nums" />
              </li>
            </ul>
            <EmptyState v-else :icon="Fingerprint" description="Os hashes aparecem aqui quando você digitar o texto." />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </section>
</template>
