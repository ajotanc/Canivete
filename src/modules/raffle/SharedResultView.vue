<script setup lang="ts">
import { AlertTriangle, Dices, SearchX, ShieldCheck, Trophy, TriangleAlert, Users } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/EmptyState.vue'
import CardSkeleton from '@/components/skeletons/CardSkeleton.vue'
import { Skeleton } from '@/components/ui/skeleton'
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
    <div v-if="state === 'loading'" class="space-y-4" role="status" aria-label="Carregando o sorteio">
      <Skeleton class="h-44 w-full rounded-3xl" />
      <CardSkeleton :rows="2" />
    </div>

    <EmptyState v-else-if="state === 'not-found'" page :icon="SearchX" description="Sorteio não encontrado. Confira se o link está completo.">
      <Button as-child size="lg"><RouterLink to="/raffle">Fazer um novo sorteio</RouterLink></Button>
    </EmptyState>

    <EmptyState v-else-if="state === 'error'" page :icon="TriangleAlert" :description="`Não foi possível abrir o sorteio. ${errorMessage}`">
      <Button as-child size="lg"><RouterLink to="/raffle">Fazer um novo sorteio</RouterLink></Button>
    </EmptyState>

    <template v-else-if="raffle">
      <PageHeader filled :icon="Dices" title="Resultado do sorteio" :description="`Sorteio de ${formatDate(raffle.drawnAt)}`">
        <template v-if="verified" #badge>
          <Badge variant="glass" class="gap-1.5 py-1"><ShieldCheck aria-hidden="true" />Registro verificado</Badge>
        </template>
        <FactList>
          <FactTile :icon="Users" label="Participantes">{{ raffle.participants.length }} {{ raffle.participants.length === 1 ? 'nome' : 'nomes' }}</FactTile>
          <FactTile :icon="Trophy" label="Sorteados">{{ raffle.winners.length }} {{ raffle.winners.length === 1 ? 'vencedor' : 'vencedores' }}</FactTile>
          <FactTile v-if="verified" :icon="ShieldCheck" label="Registro" tone="paper">Não foi alterado depois de criado</FactTile>
          <FactTile v-else :icon="AlertTriangle" label="Registro" tone="paper">Não confere com o original</FactTile>
        </FactList>
      </PageHeader>
      <Alert v-if="!verified" variant="destructive">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>Este registro não confere</AlertTitle>
        <AlertDescription>O conteúdo não bate com o código de verificação gravado. Não confie neste resultado.</AlertDescription>
      </Alert>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{{ raffle.winners.length === 1 ? 'Vencedor' : 'Vencedores' }}</CardTitle>
        </CardHeader>
        <CardContent class="space-y-6">
          <ul class="overflow-hidden rounded-2xl border border-primary/20 bg-primary p-2 shadow-[0_16px_32px_-20px_color-mix(in_oklab,var(--primary),transparent_20%)]">
            <li
              v-for="(winner, index) in raffle.winners"
              :key="index"
              class="flex items-center gap-3 rounded-xl bg-card px-4 py-4 text-card-foreground shadow-sm"
            >
              <div class="flex size-10 shrink-0 items-center justify-center rounded-chip border border-primary/20 bg-primary/10 text-primary">
                <Trophy aria-hidden="true" class="size-5" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {{ raffle.winners.length === 1 ? 'Nome sorteado' : `${index + 1}º sorteado` }}
                </p>
                <p class="truncate text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{{ winner }}</p>
              </div>
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
          <p v-if="verified" class="text-sm text-muted-foreground">
            A verificação mostra que este registro não foi alterado. Ela não prova que o sorteio foi justo: quem o criou fez o sorteio no próprio navegador.
          </p>
          <p class="break-all text-xs text-muted-foreground">Código: {{ raffle.hash }}</p>
        </CardContent>
      </Card>
    </template>
  </section>
</template>
