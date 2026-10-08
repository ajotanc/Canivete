<script setup lang="ts">
import { Gift, Heart, Lock, TriangleAlert } from '@lucide/vue'
import CardHeading from './components/CardHeading.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { triggerConfetti } from '@/core/effects/confetti'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import BoardPanel from './components/BoardPanel.vue'
import GiftTag from './components/GiftTag.vue'
import MeHeader from './components/MeHeader.vue'
import QuestionsPanel from './components/QuestionsPanel.vue'
import { CONFETTI } from './constants'
import { useReveal } from './composables/useReveal'
import { useUnsavedGuard } from './composables/useUnsavedGuard'
import WishlistEditor from './components/WishlistEditor.vue'
import WishlistView from './components/WishlistView.vue'
import { applyGroupColor } from './lib/groupColor'
import { markRevealed, getGroup, listMyGroups, revealMatch, SantaApiError, updateWishlist, type RevealResult, type WishItem } from './lib/api'
import { invitePath } from './lib/links'
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

/** Compara a lista pelo que importa: linhas vazias e espaços nas pontas não contam como alteração. */
const snapshot = (items: WishItem[]) =>
  JSON.stringify(items.filter((i) => i.text.trim()).map((i) => ({ text: i.text.trim(), url: i.url?.trim() || undefined })))
/** Última versão da lista que o servidor tem. */
const savedSnapshot = ref('[]')
/** Quantos presentes de quem você tirou têm link de compra. */
const linkCount = computed(() => (result.value && 'receiver' in result.value ? result.value.receiver.wishlist.filter((item) => item.url).length : 0))
const dirty = computed(() => snapshot(wishlist.value) !== savedSnapshot.value)
useUnsavedGuard(dirty)

async function onLogout() {
  // A lista com alterações pendentes é perguntada pelo guarda de saída da rota.
  clearCredentials(groupId)
  await router.replace(invitePath(groupId))
}

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
  triggerConfetti({ durationMs: CONFETTI.durationMs, colors: [...CONFETTI.colors] })
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
    savedSnapshot.value = snapshot(wishlist.value)
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
    savedSnapshot.value = snapshot(wishlist.value)
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
        <MeHeader
          :group-id="groupId"
          :group="groupInfo"
          :is-organizer="isOrganizer"
          description="Arraste o lacre para abrir sua carta. O nome some sozinho depois de 15 segundos."
          @logout="onLogout"
        >
          <template #badge>
            <Badge variant="glass" class="gap-1.5 rounded-md py-1"><Lock aria-hidden="true" />Só você vê isto</Badge>
          </template>
        </MeHeader>

        <div class="grid items-start gap-x-6 gap-y-8 lg:grid-cols-2">
          <div class="space-y-4">
            <h2 class="text-xl">Quem você tirou</h2>
            <div class="space-y-6">
            <GiftTag
              :name="result.receiver.name"
              :revealed="revealed"
              :names="pool"
              @landed="onLanded"
              @reveal="reveal"
            />

            <Card>
              <CardHeader>
                <CardHeading :icon="Gift">{{ landed ? `O que ${result.receiver.name} gostaria de ganhar` : 'O que quem você tirou gostaria de ganhar' }}</CardHeading>
                <CardDescription v-if="!landed">Aparece quando você abrir a carta.</CardDescription>
                <CardDescription v-else-if="result.receiver.wishlist.length > 0">
                  {{ result.receiver.wishlist.length }} {{ result.receiver.wishlist.length === 1 ? 'ideia' : 'ideias' }} de presente{{ linkCount > 0 ? `, ${linkCount} com ${linkCount === 1 ? 'link' : 'links'} para comprar` : '' }}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div v-if="!landed" class="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center">
                  <span class="flex size-10 items-center justify-center rounded-chip border bg-muted text-muted-foreground" aria-hidden="true"><Lock class="size-5" /></span>
                  <p class="text-sm text-muted-foreground">Arraste o lacre da carta para ver a lista.</p>
                </div>
                <WishlistView v-else :items="result.receiver.wishlist" :name="result.receiver.name.split(' ')[0]" />
              </CardContent>
            </Card>

            <QuestionsPanel v-if="credentials" :credentials="{ groupId, ...credentials }" :receiver-name="landed ? result.receiver.name : 'quem você tirou'" />
            </div>
          </div>

          <div class="space-y-4">
            <h2 class="text-xl">Você e o grupo</h2>
            <div class="space-y-6">
            <Card>
              <CardHeader>
                <CardHeading :icon="Heart">Minha lista de presentes</CardHeading>
                <CardDescription>Quem tirou você vê a versão mais nova.</CardDescription>
              </CardHeader>
              <CardContent>
                <form class="space-y-4" @submit.prevent="onSave">
                  <WishlistEditor v-model="wishlist" />
                  <p v-if="dirty" class="text-center text-sm font-medium text-warning" role="status">Alterações não salvas</p>
                  <Button type="submit" size="lg" class="w-full" :disabled="saving || !dirty">
                    <Spinner v-if="saving" />
                    {{ saving ? 'Salvando...' : 'Salvar lista' }}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <BoardPanel v-if="credentials" :credentials="{ groupId, ...credentials }" />
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div class="space-y-6">
            <MeHeader
              :group-id="groupId"
              :group="groupInfo"
              :is-organizer="isOrganizer"
              :description="`Tudo certo, ${credentials?.name}. O sorteio ainda não aconteceu: quando o organizador sortear, volte aqui para ver quem você tirou.`"
              @logout="onLogout"
            />
            <Card>
              <CardContent>
                <form class="space-y-4" @submit.prevent="onSave">
                  <Field>
                    <FieldLabel>O que você gostaria de ganhar</FieldLabel>
                    <WishlistEditor v-model="wishlist" />
                    <FieldDescription>Quem tirar você vai ver essa lista. Se tiver o link do produto, toque no ícone de link e cole.</FieldDescription>
                  </Field>
                  <p v-if="dirty" class="text-center text-sm font-medium text-warning" role="status">Alterações não salvas</p>
                  <Button type="submit" size="lg" class="w-full" :disabled="saving || !dirty">
                    <Spinner v-if="saving" />
                    {{ saving ? 'Salvando...' : 'Salvar lista' }}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <BoardPanel v-if="credentials" :credentials="{ groupId, ...credentials }" />
        </div>
      </template>


    </template>
  </section>
</template>
