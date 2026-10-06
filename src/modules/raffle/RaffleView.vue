<script setup lang="ts">
import { Check, Copy, Dices, Link } from '@lucide/vue'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import DrawAnimation from './components/DrawAnimation.vue'
import DrawHistory from './components/DrawHistory.vue'
import NameList from './components/NameList.vue'
import { useRaffle } from './composables/useRaffle'
import { createShare, ShareError } from './lib/share'

const { rawInput, winnerCount, noRepeat, history, currentRound, drawError, canDraw, draw, clearHistory } = useRaffle()

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
  <section class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">Sorteador de nomes</h1>
      <p class="text-muted-foreground">Cole a lista, escolha quantos vencedores e sorteie.</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent class="pt-6">
          <NameList v-model="rawInput" />
        </CardContent>
      </Card>

      <div class="space-y-6">
        <Card>
          <CardHeader><CardTitle>Opções</CardTitle></CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center gap-3">
              <Label for="winner-count" class="w-40">Quantidade de vencedores</Label>
              <Input id="winner-count" v-model.number="winnerCount" type="number" min="1" class="w-24" />
            </div>
            <div class="flex items-center gap-3">
              <Switch id="no-repeat" v-model="noRepeat" />
              <Label for="no-repeat">Remover sorteados da lista (sem repetição)</Label>
            </div>
            <p v-if="drawError && rawInput.trim() !== ''" class="text-sm text-destructive" role="alert">
              {{ drawError }}
            </p>
            <Button class="w-full" :disabled="!canDraw || animating" @click="onDraw">
              <Dices class="size-4" />
              Sortear
            </Button>
          </CardContent>
        </Card>

        <Card v-if="currentRound">
          <CardHeader><CardTitle>Resultado</CardTitle></CardHeader>
          <CardContent class="space-y-4">
            <DrawAnimation
              :names="currentRound.participants"
              :winners="currentRound.winners"
              @done="animating = false"
            />
            <div class="space-y-2">
              <Button variant="outline" class="w-full" :disabled="animating || sharing" @click="onShare">
                <Link class="size-4" />
                {{ sharing ? 'Gerando link...' : 'Gerar link compartilhável' }}
              </Button>
              <div v-if="shareUrl" class="flex gap-2">
                <Input :model-value="shareUrl" readonly aria-label="Link do sorteio" />
                <Button variant="outline" size="icon" aria-label="Copiar link" @click="onCopy">
                  <Check v-if="copied" class="size-4" />
                  <Copy v-else class="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <DrawHistory :rounds="history" @clear="clearHistory" />
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>
