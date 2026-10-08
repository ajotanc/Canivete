<script setup lang="ts">
import { ArrowDown, CaseSensitive, Eraser, Replace, Zap, Braces } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { applyTransform, TRANSFORMS, type Transform, type TransformId } from './lib/text'

const input = ref('')
const selected = ref<TransformId>('upper')

const result = computed(() => (input.value ? applyTransform(selected.value, input.value) : null))
const output = computed(() => (result.value?.ok ? result.value.value : ''))
const error = computed(() => (result.value && !result.value.ok ? result.value.error : ''))

const groups = computed(() => {
  const map = new Map<string, Transform[]>()
  for (const transform of TRANSFORMS) map.set(transform.group, [...(map.get(transform.group) ?? []), transform])
  return [...map.entries()]
})

async function copy() {
  try {
    await navigator.clipboard.writeText(output.value)
    toast.success('Texto copiado.')
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}

/** Usa o resultado como novo texto de entrada, para encadear transformações. */
function useAsInput() {
  input.value = output.value
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="CaseSensitive" title="Ferramentas de texto" description="Troque maiúsculas e minúsculas, gere slugs, limpe listas e codifique em Base64 ou URL.">
      <FactList>
        <FactTile :icon="Replace" label="Opções">17 ações</FactTile>
        <FactTile :icon="Braces" label="Códigos">Base64 e URL</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">O que fazer</CardTitle>
          <CardDescription>Escolha uma ação; o resultado aparece na hora.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <fieldset v-for="[group, items] in groups" :key="group" class="space-y-2">
            <legend class="mb-2 text-sm font-medium">{{ group }}</legend>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="item in items"
                :key="item.id"
                class="inline-flex min-h-10 cursor-pointer items-center rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 motion-reduce:transition-none"
              >
                <input v-model="selected" type="radio" name="transform" :value="item.id" class="sr-only" />
                {{ item.label }}
              </label>
            </div>
          </fieldset>
        </CardContent>
      </Card>

      <div class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Seu texto</CardTitle>
            <CardDescription>O texto fica só no seu aparelho; nada é enviado.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel for="input" class="sr-only">Texto original</FieldLabel>
              <InputGroup class="bg-card">
                <InputGroupTextarea id="input" v-model="input" placeholder="Escreva ou cole aqui…" class="h-40 min-h-0 flex-none resize-none overflow-y-auto text-base field-sizing-fixed" />
                <InputGroupAddon align="block-end" class="justify-end border-t">
                  <Button type="button" variant="ghost" size="sm" class="h-9" :disabled="!input" @click="input = ''">
                    <Eraser aria-hidden="true" />
                    Limpar
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert v-if="error" variant="destructive" role="alert">
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>
            <Field v-else>
              <FieldLabel for="output" class="sr-only">Resultado</FieldLabel>
              <InputGroup class="bg-card">
                <InputGroupTextarea id="output" :model-value="output" readonly placeholder="O resultado aparece aqui." class="h-40 min-h-0 flex-none resize-none overflow-y-auto text-base field-sizing-fixed" @focus="($event.target as HTMLTextAreaElement).select()" />
                <InputGroupAddon align="block-end" class="justify-between border-t">
                  <Button type="button" variant="ghost" size="sm" class="h-9" :disabled="!output" @click="useAsInput">
                    <ArrowDown class="rotate-180" aria-hidden="true" />
                    Usar como texto
                  </Button>
                  <Button type="button" variant="ghost" size="sm" class="h-9" :disabled="!output" @click="copy">Copiar</Button>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>
