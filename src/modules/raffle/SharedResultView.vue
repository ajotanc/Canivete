<script setup lang="ts">
import { AlertTriangle, ShieldCheck } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { loadShare, ShareError, type StoredRaffle } from './lib/share'

type State = 'loading' | 'ready' | 'not-found' | 'error'

const route = useRoute()
const state = ref<State>('loading')
const raffle = ref<StoredRaffle | null>(null)
const verified = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const result = await loadShare(String(route.params.id))
    raffle.value = result.raffle
    verified.value = result.verified
    state.value = 'ready'
  } catch (error) {
    if (error instanceof ShareError && error.code === 'NOT_FOUND') {
      state.value = 'not-found'
    } else {
      errorMessage.value =
        error instanceof ShareError ? error.message : 'Algo deu errado ao abrir este sorteio.'
      state.value = 'error'
    }
  }
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
}
</script>

<template>
  <section class="mx-auto max-w-2xl space-y-6">
    <p v-if="state === 'loading'" class="py-12 text-center text-muted-foreground">Carregando sorteio...</p>

    <div v-else-if="state === 'not-found'" class="space-y-4 py-12 text-center">
      <h1 class="text-2xl font-bold">Sorteio não encontrado</h1>
      <p class="text-muted-foreground">Confira se o link está completo.</p>
      <Button as-child><RouterLink to="/raffle">Fazer um novo sorteio</RouterLink></Button>
    </div>

    <div v-else-if="state === 'error'" class="space-y-4 py-12 text-center">
      <h1 class="text-2xl font-bold">Não foi possível abrir o sorteio</h1>
      <p class="text-muted-foreground">{{ errorMessage }}</p>
      <Button as-child><RouterLink to="/raffle">Fazer um novo sorteio</RouterLink></Button>
    </div>

    <template v-else-if="raffle">
      <div
        v-if="verified"
        class="flex items-start gap-3 rounded-lg border border-green-600/40 bg-green-600/10 p-4"
      >
        <ShieldCheck class="mt-0.5 size-5 shrink-0 text-green-600" />
        <div class="space-y-1 text-sm">
          <p class="font-semibold">Registro verificado</p>
          <p class="text-muted-foreground">
            Este registro não foi alterado depois de criado. A verificação não prova que o sorteio foi
            justo: quem o criou fez o sorteio no próprio navegador.
          </p>
        </div>
      </div>
      <div
        v-else
        class="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4"
      >
        <AlertTriangle class="mt-0.5 size-5 shrink-0 text-destructive" />
        <div class="space-y-1 text-sm">
          <p class="font-semibold">Este registro não confere</p>
          <p class="text-muted-foreground">
            O conteúdo não bate com o código de verificação gravado. Não confie neste resultado.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{{ raffle.winners.length === 1 ? 'Vencedor' : 'Vencedores' }}</CardTitle>
          <p class="text-sm text-muted-foreground">Sorteio de {{ formatDate(raffle.drawnAt) }}</p>
        </CardHeader>
        <CardContent class="space-y-6">
          <ul class="space-y-2">
            <li
              v-for="(winner, index) in raffle.winners"
              :key="index"
              class="rounded-lg border border-primary bg-primary/10 px-4 py-3 text-center text-2xl font-bold text-primary"
            >
              {{ winner }}
            </li>
          </ul>
          <details class="text-sm">
            <summary class="cursor-pointer font-medium">
              Ver os {{ raffle.participants.length }} participantes
            </summary>
            <ul class="mt-2 list-inside list-disc text-muted-foreground">
              <li v-for="(name, index) in raffle.participants" :key="index">{{ name }}</li>
            </ul>
          </details>
          <p class="break-all font-mono text-xs text-muted-foreground">Código: {{ raffle.hash }}</p>
        </CardContent>
      </Card>
    </template>
  </section>
</template>
