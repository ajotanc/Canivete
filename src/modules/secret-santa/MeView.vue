<script setup lang="ts">
import { ArrowLeft, CalendarDays, Coins, Gift, Lock, TriangleAlert, Users } from '@lucide/vue'
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { triggerConfetti } from '@/core/effects/confetti'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import BoardPanel from './components/BoardPanel.vue'
import GiftTag from './components/GiftTag.vue'
import QuestionsPanel from './components/QuestionsPanel.vue'
import { useReveal } from './composables/useReveal'
import WishlistEditor from './components/WishlistEditor.vue'
import WishlistView from './components/WishlistView.vue'
import { applyGroupColor } from './lib/groupColor'
import { markRevealed, getGroup, listMyGroups, revealMatch, SantaApiError, updateWishlist, type RevealResult, type WishItem } from './lib/api'
import { formatMoney } from '@/lib/money'
import { eventCountdown, formatEventDate } from './lib/event'
import { adminPath, invitePath } from './lib/links'
import { clearCredentials, loadCredentials } from './lib/session'

const route = useRoute()
const router = useRouter()
const groupId = String(route.params.id)

type State = 'loading' | 'ready' | 'error'
const state = ref<State>('loading')
const errorMessage = ref('')
const result = ref<RevealResult | null>(null)
const wishlist = ref<WishItem[]>([])
/** O dono do grupo (conta logada) vê o botão de voltar ao painel. */
const isOrganizer = ref(false)
const saving = ref(false)
const { revealed, reveal } = useReveal()

const credentials = loadCredentials(groupId)

/** O nome já apareceu na roleta: aí sim solta confetes e libera a lista de desejos. */
const landed = ref(false)
/** Nomes do grupo (menos o seu) que passam na roleta antes do sorteado. */
const pool = ref<string[]>([])
/** Dados do grupo para o cabeçalho (nome, valor e data da troca). */
const groupInfo = ref<{ name: string; budget: number | null; eventDate: string; participantCount: number } | null>(null)

function onLanded() {
  landed.value = true
  if (credentials) void markRevealed({ groupId, ...credentials }).catch(() => {})
  navigator.vibrate?.([40, 60, 40])
  triggerConfetti({ durationMs: 3500, colors: ['#C2255C', '#FF7AA2', '#F2B600', '#2457F5', '#FFFFFF'] })
}

watch(revealed, (isRevealed) => {
  if (!isRevealed) landed.value = false
})

onMounted(async () => {
  // Sem credenciais na sessão (aba nova ou recarregada sem storage): volta para a tela de entrada.
  if (!credentials) {
    await router.replace({ path: invitePath(groupId), query: route.query })
    return
  }
  try {
    result.value = await revealMatch({ groupId, ...credentials })
    wishlist.value = result.value.wishlist
    getGroup(groupId)
      .then((group) => {
        applyGroupColor(group.color)
        pool.value = group.members.map((m) => m.name).filter((n) => n !== credentials.name)
        groupInfo.value = { name: group.name, budget: group.budget, eventDate: group.eventDate, participantCount: group.participantCount }
      })
      .catch(() => {})
    state.value = 'ready'
    listMyGroups()
      .then(({ groups }) => {
        isOrganizer.value = groups.some((g) => g.id === groupId)
      })
      .catch(() => {})
  } catch (e) {
    if (e instanceof SantaApiError && (e.code === 'BAD_CREDENTIALS' || e.code === 'LOCKED' || e.code === 'PIN_NOT_SET')) {
      clearCredentials(groupId)
      await router.replace(invitePath(groupId))
      return
    }
    errorMessage.value = e instanceof SantaApiError ? e.message : 'Não foi possível abrir seu painel.'
    state.value = 'error'
  }
})

async function onSave() {
  if (!credentials) return
  saving.value = true
  try {
    await updateWishlist({ groupId, ...credentials, wishlist: wishlist.value })
    toast.success('Lista de desejos salva.')
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível salvar.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-5xl space-y-8">
    <div v-if="state === 'loading'" class="space-y-4" role="status" aria-label="Abrindo seu painel">
      <Skeleton class="h-9 w-1/2" />
      <Skeleton class="h-64 w-full max-w-sm" />
    </div>

    <Empty v-else-if="state === 'error'" class="rounded-xl border border-dashed bg-card/50 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon"><TriangleAlert aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Não foi possível abrir seu painel</EmptyTitle>
        <EmptyDescription>{{ errorMessage }}</EmptyDescription>
      </EmptyHeader>
      <Button size="lg" @click="$router.go(0)">Tentar de novo</Button>
    </Empty>

    <template v-else-if="result">
      <template v-if="result.status === 'drawn'">
        <PageHeader filled size="lg" :icon="Gift" :title="groupInfo?.name ?? 'Seu amigo secreto'" description="Arraste o lacre para abrir sua carta. O nome some sozinho depois de 15 segundos.">
          <template v-if="isOrganizer" #back>
            <Button as-child variant="ghost" size="sm">
              <RouterLink :to="adminPath(groupId)"><ArrowLeft aria-hidden="true" />Painel do organizador</RouterLink>
            </Button>
          </template>
          <template #badge>
            <Badge variant="glass" class="gap-1.5 rounded-md py-1"><Lock aria-hidden="true" />Só você vê isto</Badge>
          </template>
        <dl v-if="groupInfo" class="grid grid-cols-2 gap-3 pt-2">
          <FactTile :icon="Users" label="Participantes">{{ groupInfo.participantCount }} {{ groupInfo.participantCount === 1 ? 'pessoa' : 'pessoas' }}</FactTile>
          <FactTile v-if="groupInfo.budget !== null" :icon="Coins" label="Valor sugerido">{{ formatMoney(groupInfo.budget) }}</FactTile>
          <FactTile v-if="groupInfo.eventDate" :icon="CalendarDays" :label="eventCountdown(groupInfo.eventDate)" tone="paper" class="col-span-2">{{ formatEventDate(groupInfo.eventDate) }}</FactTile>
        </dl>
        </PageHeader>

        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div class="space-y-6">
            <GiftTag
              :name="result.receiver.name"
              :revealed="revealed"
              :names="pool"
              @landed="onLanded"
              @reveal="reveal"
            />

            <Card v-if="landed" class="animate-in fade-in slide-in-from-bottom-3 duration-500 motion-reduce:animate-none">
              <CardHeader>
                <CardTitle class="text-lg">O que {{ result.receiver.name }} gostaria de ganhar</CardTitle>
              </CardHeader>
              <CardContent>
                <WishlistView v-if="result.receiver.wishlist.length > 0" :items="result.receiver.wishlist" />
                <p v-else class="text-sm text-muted-foreground">Ainda não escreveu nada.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle class="text-lg">Minha lista de presentes</CardTitle>
                <CardDescription>Quem tirou você vê a versão mais nova.</CardDescription>
              </CardHeader>
              <CardContent>
                <form class="space-y-4" @submit.prevent="onSave">
                  <WishlistEditor v-model="wishlist" />
                  <Button type="submit" size="lg" class="w-full" :disabled="saving">
                    <Spinner v-if="saving" />
                    {{ saving ? 'Salvando...' : 'Salvar lista' }}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div class="space-y-6">
            <QuestionsPanel v-if="credentials" :credentials="{ groupId, ...credentials }" :receiver-name="landed ? result.receiver.name : 'quem você tirou'" />
            <BoardPanel v-if="credentials" :credentials="{ groupId, ...credentials }" />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div class="space-y-6">
            <PageHeader filled size="lg" :icon="Gift" :title="groupInfo?.name ?? 'Seu amigo secreto'" :description="`Tudo certo, ${credentials?.name}. O sorteio ainda não aconteceu: quando o organizador sortear, volte aqui para ver quem você tirou.`">
          <template v-if="isOrganizer" #back>
            <Button as-child variant="ghost" size="sm">
              <RouterLink :to="adminPath(groupId)"><ArrowLeft aria-hidden="true" />Painel do organizador</RouterLink>
            </Button>
          </template>
            <dl v-if="groupInfo" class="grid grid-cols-2 gap-3 pt-2">
              <FactTile :icon="Users" label="Participantes">{{ groupInfo.participantCount }} {{ groupInfo.participantCount === 1 ? 'pessoa' : 'pessoas' }}</FactTile>
              <FactTile v-if="groupInfo.budget !== null" :icon="Coins" label="Valor sugerido">{{ formatMoney(groupInfo.budget) }}</FactTile>
              <FactTile v-if="groupInfo.eventDate" :icon="CalendarDays" :label="eventCountdown(groupInfo.eventDate)" tone="paper" class="col-span-2">{{ formatEventDate(groupInfo.eventDate) }}</FactTile>
            </dl>
            </PageHeader>
            <Card>
              <CardContent>
                <form class="space-y-4" @submit.prevent="onSave">
                  <Field>
                    <FieldLabel>O que você gostaria de ganhar</FieldLabel>
                    <WishlistEditor v-model="wishlist" />
                    <FieldDescription>Quem tirar você vai ver essa lista. Se tiver o link do produto, ligue o interruptor e cole.</FieldDescription>
                  </Field>
                  <Button type="submit" size="lg" class="w-full" :disabled="saving">
                    <Spinner v-if="saving" />
                    {{ saving ? 'Salvando...' : 'Salvar lista' }}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Button as-child variant="ghost"><RouterLink :to="invitePath(groupId)">Voltar ao grupo</RouterLink></Button>
          </div>
          <BoardPanel v-if="credentials" :credentials="{ groupId, ...credentials }" />
        </div>
      </template>


    </template>
  </section>
</template>
