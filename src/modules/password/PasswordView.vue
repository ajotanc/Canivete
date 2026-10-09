<script setup lang="ts">
import { Dices, KeyRound, RefreshCw, ShieldCheck, Zap } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import CopyField from '@/components/CopyField.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { LENGTH_DEFAULT, LENGTH_MAX, LENGTH_MIN, WORDS_DEFAULT, WORDS_MAX, WORDS_MIN } from './constants'
import { activePools, entropyBits, generatePassphrase, generatePassword, passphraseEntropyBits, strengthOf, type PasswordOptions, type Strength } from './lib/password'

const mode = ref<'password' | 'passphrase'>('password')
const options = reactive<PasswordOptions>({ length: LENGTH_DEFAULT, lower: true, upper: true, digits: true, symbols: true, avoidAmbiguous: false })
const words = ref(WORDS_DEFAULT)
const withNumber = ref(true)
const value = ref('')

function generate() {
  value.value = mode.value === 'password' ? generatePassword(options) : generatePassphrase(words.value, withNumber.value)
}
watch([mode, options, words, withNumber], generate, { immediate: true, deep: true, flush: 'sync' })

const bits = computed(() => {
  if (mode.value === 'passphrase') return passphraseEntropyBits(words.value, withNumber.value)
  return entropyBits(activePools(options).join('').length, Math.max(options.length, activePools(options).length))
})
const strength = computed(() => strengthOf(bits.value))

const STRENGTH: Record<Strength, { label: string; bar: string; width: string }> = {
  weak: { label: 'Fraca', bar: 'bg-destructive', width: 'w-1/4' },
  fair: { label: 'Razoável', bar: 'bg-warning', width: 'w-2/4' },
  good: { label: 'Boa', bar: 'bg-primary', width: 'w-3/4' },
  strong: { label: 'Forte', bar: 'bg-success', width: 'w-full' },
}

const toggles = [
  { key: 'lower', label: 'Minúsculas', hint: 'a–z' },
  { key: 'upper', label: 'Maiúsculas', hint: 'A–Z' },
  { key: 'digits', label: 'Números', hint: '0–9' },
  { key: 'symbols', label: 'Símbolos', hint: '!@#$%' },
] as const

/** Impede desligar o último grupo: a senha ficaria vazia. */
function setGroup(key: (typeof toggles)[number]['key'], on: boolean) {
  if (!on && activePools(options).length <= 1) return
  options[key] = on
}

function onMode(next: unknown) {
  if (next === 'password' || next === 'passphrase') mode.value = next
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="KeyRound" title="Gerador de senhas" description="Crie senhas e frases aleatórias fortes, com o tamanho e os caracteres que o site pedir.">
      <FactList>
        <FactTile :icon="Dices" label="Sorteio">Seguro</FactTile>
        <FactTile :icon="ShieldCheck" label="Senha">Fica aqui</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper">Sem cadastro</FactTile>
      </FactList>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Como gerar</CardTitle>
          <CardDescription>Ao mudar uma opção, a senha já é gerada de novo.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <ToggleGroup type="single" variant="outline" :model-value="mode" aria-label="Tipo" class="w-full bg-card" @update:model-value="onMode">
              <ToggleGroupItem value="password" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Senha</ToggleGroupItem>
              <ToggleGroupItem value="passphrase" class="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Frase</ToggleGroupItem>
            </ToggleGroup>

            <template v-if="mode === 'password'">
              <Field>
                <div class="flex items-baseline justify-between">
                  <FieldLabel for="length">Tamanho</FieldLabel>
                  <span class="font-semibold tabular-nums">{{ options.length }}</span>
                </div>
                <Slider id="length" thumb-label="Tamanho" :model-value="[options.length]" :min="LENGTH_MIN" :max="LENGTH_MAX" :step="1" @update:model-value="options.length = $event?.[0] ?? options.length" />
              </Field>
              <Field v-for="toggle in toggles" :key="toggle.key" orientation="horizontal">
                <FieldContent>
                  <FieldLabel :for="toggle.key">{{ toggle.label }}</FieldLabel>
                  <FieldDescription class="tabular-nums">{{ toggle.hint }}</FieldDescription>
                </FieldContent>
                <Switch :id="toggle.key" :model-value="options[toggle.key]" @update:model-value="setGroup(toggle.key, $event === true)" />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel for="ambiguous">Sem caracteres confusos</FieldLabel>
                  <FieldDescription>Tira O, 0, l, 1 e I.</FieldDescription>
                </FieldContent>
                <Switch id="ambiguous" v-model="options.avoidAmbiguous" />
              </Field>
            </template>
            <template v-else>
              <Field>
                <div class="flex items-baseline justify-between">
                  <FieldLabel for="words">Palavras</FieldLabel>
                  <span class="font-semibold tabular-nums">{{ words }}</span>
                </div>
                <Slider id="words" thumb-label="Palavras" :model-value="[words]" :min="WORDS_MIN" :max="WORDS_MAX" :step="1" @update:model-value="words = $event?.[0] ?? words" />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel for="with-number">Número no fim</FieldLabel>
                  <FieldDescription>Soma um número de 0 a 99.</FieldDescription>
                </FieldContent>
                <Switch id="with-number" v-model="withNumber" />
              </Field>
            </template>

            <Button size="lg" class="w-full" @click="generate">
              <RefreshCw aria-hidden="true" />
              Gerar outra
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Resultado</CardTitle>
          <CardDescription>Gerada neste aparelho; nada é enviado nem guardado.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <CopyField :value="value" label="Senha" message="Senha copiada." input-class="text-base sm:text-xl" class="tabular-nums" />
          <div class="space-y-2" role="status">
            <div class="flex items-baseline justify-between text-sm">
              <span class="font-medium">{{ STRENGTH[strength].label }}</span>
              <span class="tabular-nums text-muted-foreground">{{ bits }} bits de entropia</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-muted">
              <div class="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none" :class="[STRENGTH[strength].bar, STRENGTH[strength].width]" />
            </div>
          </div>
          <p class="text-sm text-muted-foreground">Quanto mais bits, mais tentativas um ataque precisa. Acima de 60 já é uma boa senha; guarde num gerenciador de senhas.</p>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
