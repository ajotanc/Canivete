<script setup lang="ts">
import { Check, Copy, Dices, Link, ListChecks, ShieldCheck, Trash2, Zap } from '@lucide/vue'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from '@/components/ui/number-field'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import DrawAnimation from './components/DrawAnimation.vue'
import DrawHistory from './components/DrawHistory.vue'
import NameList from './components/NameList.vue'
import { useRaffle } from './composables/useRaffle'
import { createShare, ShareError } from './lib/share'

const { rawInput, winnerCount, noRepeat, history, currentRound, parsed, drawError, canDraw, draw, clearHistory } = useRaffle()

const clearOpen = ref(false)
const animating = ref(false)
const sharing = ref(false)
const shareUrl = ref<string | null>(null)
const copied = ref(false)

// Cada nova rodada invalida o link anterior.
watch(currentRound, () => {
  shareUrl.value = null
  copied.value = false
})

function onDraw() {
  const round = draw()
  animating.value = round !== null
}

async function onShare() {
  if (!currentRound.value) return
  sharing.value = true
  try {
    const { participants, winners, drawnAt } = currentRound.value
    const id = await createShare({ participants, winners, drawnAt })
    shareUrl.value = `${window.location.origin}/raffle/r/${id}`
    toast.success('Link gerado!')
  } catch (error) {
    toast.error(error instanceof ShareError ? error.message : 'Não foi possível gerar o link.')
  } finally {
    sharing.value = false
  }
}

async function onCopy() {
  if (!shareUrl.value) return
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    toast.success('Link copiado!')
  } catch {
    toast.error('Não foi possível copiar. Selecione o link e copie manualmente.')
  }
}
</script>

<template>
  <section class="space-y-8">
    <PageHeader filled :icon="Dices" title="Sorteador de nomes" description="Cole a lista, escolha quantos vencedores e sorteie.">
      <dl class="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
        <FactTile :icon="ListChecks" label="Na lista">{{ parsed.names.length }} {{ parsed.names.length === 1 ? 'nome' : 'nomes' }}</FactTile>
        <FactTile :icon="ShieldCheck" label="Resultado">Verificável</FactTile>
        <FactTile :icon="Zap" label="Para usar" tone="paper" class="col-span-2 sm:col-span-1">Sem cadastro</FactTile>
      </dl>
    </PageHeader>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Lista de nomes</CardTitle>
          <CardDescription>Um nome por linha. Nomes repetidos contam como mais chances.</CardDescription>
        </CardHeader>
        <CardContent>
          <NameList v-model="rawInput" />
        </CardContent>
      </Card>

      <div class="space-y-6">
        <Card>
          <CardHeader><CardTitle class="text-lg">Opções</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel for="winner-count">Vencedores</FieldLabel>
                  <FieldDescription>Quantos nomes saem do sorteio.</FieldDescription>
                </FieldContent>
                <NumberField id="winner-count" v-model="winnerCount" :min="1" class="w-32">
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput class="h-11" />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel for="no-repeat">Remover sorteados da lista</FieldLabel>
                  <FieldDescription>Quem sair não concorre na próxima rodada.</FieldDescription>
                </FieldContent>
                <Switch id="no-repeat" v-model="noRepeat" />
              </Field>
              <FieldError v-if="drawError && rawInput.trim() !== ''">{{ drawError }}</FieldError>
              <Button size="lg" class="w-full" :disabled="!canDraw || animating" @click="onDraw">
                <Dices aria-hidden="true" />
                Sortear
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card v-if="currentRound">
          <CardHeader>
            <CardTitle class="text-lg">{{ currentRound.winners.length === 1 ? 'Resultado do sorteio' : 'Resultados do sorteio' }}</CardTitle>
            <CardDescription>{{ animating ? 'Os nomes estão passando...' : 'Os nomes sorteados nesta rodada.' }}</CardDescription>
          </CardHeader>
          <CardContent class="space-y-5">
            <DrawAnimation :names="currentRound.participants" :winners="currentRound.winners" @done="animating = false" />
            <div class="space-y-3">
              <Button variant="outline" class="w-full" :disabled="animating || sharing" @click="onShare">
                <Spinner v-if="sharing" />
                <Link v-else aria-hidden="true" />
                {{ sharing ? 'Gerando link...' : 'Gerar link verificável' }}
              </Button>
              <InputGroup v-if="shareUrl" class="h-11 bg-card">
                <InputGroupAddon><Link aria-hidden="true" /></InputGroupAddon>
                <InputGroupInput :model-value="shareUrl" readonly aria-label="Link do sorteio" />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="sm" :aria-label="copied ? 'Link copiado' : 'Copiar link'" @click="onCopy">
                    <Check v-if="copied" aria-hidden="true" />
                    <Copy v-else aria-hidden="true" />
                    {{ copied ? 'Copiado' : 'Copiar' }}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <Alert v-if="shareUrl" class="border-success/40 bg-success/10 text-success">
                <ShieldCheck aria-hidden="true" />
                <AlertTitle>Registro verificável</AlertTitle>
                <AlertDescription>Quem abrir o link vê a lista, os vencedores e confere se o registro foi alterado.</AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Histórico</CardTitle>
            <CardAction v-if="history.length > 0">
              <Button variant="ghost" size="sm" @click="clearOpen = true">
                <Trash2 aria-hidden="true" />
                Limpar
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <DrawHistory :rounds="history" />
          </CardContent>
        </Card>
      </div>
    </div>

    <ConfirmDelete
      v-model:open="clearOpen"
      title="Limpar o histórico?"
      description="Os sorteios deste aparelho somem da lista. Links já compartilhados continuam funcionando."
      confirm-label="Limpar histórico"
      @confirm="clearHistory(); clearOpen = false"
    />
  </section>
</template>
