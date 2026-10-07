<script setup lang="ts">
import { CalendarDays, ChevronRight, Coins, Gift, KeyRound, SearchX, TriangleAlert, Users } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import PinField from '@/components/PinField.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { formatMoney } from '@/lib/money'
import WishlistEditor from './components/WishlistEditor.vue'
import { applyGroupColor } from './lib/groupColor'
import { getGroup, revealMatch, SantaApiError, setupPin, type GroupInfo, type WishItem } from './lib/api'
import { eventCountdown, formatEventDate } from './lib/event'
import { mePath } from './lib/links'
import { saveCredentials } from './lib/session'

const route = useRoute()
const router = useRouter()
const groupId = String(route.params.id)

type State = 'loading' | 'ready' | 'not-found' | 'error'
const state = ref<State>('loading')
const group = ref<GroupInfo | null>(null)
const errorMessage = ref('')

/** Nome escolhido na lista; null enquanto a pessoa não escolheu. */
const selected = ref<string | null>(null)
const pin = ref('')
const pinConfirm = ref('')
const wishlist = ref<WishItem[]>([])
const submitting = ref(false)
const formError = ref('')

const PIN_PATTERN = /^\d{4,6}$/
/** Primeiro nome de quem escolheu, para falar de forma mais próxima. */
const firstName = computed(() => (selected.value ?? '').split(' ')[0])

const member = computed(() => group.value?.members.find((m) => m.name === selected.value) ?? null)
/** Primeiro acesso: a pessoa ainda não criou o PIN. */
const isFirstAccess = computed(() => member.value !== null && !member.value.hasPin)
const canSubmit = computed(() => {
  if (submitting.value || !PIN_PATTERN.test(pin.value)) return false
  return !isFirstAccess.value || pin.value === pinConfirm.value
})

async function load() {
  try {
    group.value = await getGroup(groupId)
    applyGroupColor(group.value.color)
    state.value = 'ready'
  } catch (e) {
    if (e instanceof SantaApiError && e.code === 'GROUP_NOT_FOUND') {
      state.value = 'not-found'
    } else {
      errorMessage.value = e instanceof SantaApiError ? e.message : 'Não foi possível abrir o grupo.'
      state.value = 'error'
    }
  }
}

onMounted(async () => {
  await load()
  // Vindo do painel do organizador: já deixa o nome escolhido, só falta o PIN.
  const wanted = route.query.pessoa
  if (typeof wanted === 'string' && group.value?.members.some((m) => m.name === wanted)) choose(wanted)
})

function choose(name: string | null) {
  selected.value = name
  pin.value = ''
  pinConfirm.value = ''
  formError.value = ''
}

async function onSubmit() {
  if (!selected.value) return
  formError.value = ''
  submitting.value = true
  const credentials = { groupId, name: selected.value, pin: pin.value }
  try {
    if (isFirstAccess.value) {
      await setupPin({ ...credentials, wishlist: wishlist.value })
      toast.success('PIN criado. Guarde bem, ele é seu acesso.')
    } else {
      // Confere nome e PIN antes de seguir para o painel.
      await revealMatch(credentials)
    }
    saveCredentials(groupId, { name: credentials.name, pin: credentials.pin })
    await router.push(mePath(groupId))
  } catch (e) {
    formError.value = e instanceof SantaApiError ? e.message : 'Não foi possível continuar.'
    // A situação do PIN mudou (alguém criou ou o organizador zerou): recarrega a lista.
    if (e instanceof SantaApiError && (e.code === 'PIN_ALREADY_SET' || e.code === 'PIN_NOT_SET')) {
      const name = selected.value
      await load()
      selected.value = name
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-xl space-y-8">
    <div v-if="state === 'loading'" class="space-y-4" role="status" aria-label="Abrindo o grupo">
      <Skeleton class="h-9 w-2/3" />
      <Skeleton class="h-5 w-1/2" />
      <Skeleton class="h-40 w-full" />
    </div>

    <Empty v-else-if="state === 'not-found'" class="rounded-xl border border-dashed bg-card/50 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon"><SearchX aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Grupo não encontrado</EmptyTitle>
        <EmptyDescription>Confira se o link do convite está completo.</EmptyDescription>
      </EmptyHeader>
      <Button as-child size="lg"><RouterLink to="/secret-santa">Criar um grupo</RouterLink></Button>
    </Empty>

    <Empty v-else-if="state === 'error'" class="rounded-xl border border-dashed bg-card/50 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon"><TriangleAlert aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Não foi possível abrir o grupo</EmptyTitle>
        <EmptyDescription>{{ errorMessage }}</EmptyDescription>
      </EmptyHeader>
      <Button size="lg" @click="$router.go(0)">Tentar de novo</Button>
    </Empty>

    <template v-else-if="group">
      <PageHeader
        filled
        :icon="Gift"
        :title="group.name"
        :description="
          group.status === 'open'
            ? 'Você foi convidado. Escolha seu nome e crie um PIN para participar.'
            : 'O sorteio já foi feito. Escolha seu nome para ver quem você tirou.'
        "
      >
        <dl class="grid grid-cols-2 gap-3 pt-2">
          <FactTile :icon="Users" label="Participantes">{{ group.participantCount }} {{ group.participantCount === 1 ? 'pessoa' : 'pessoas' }}</FactTile>
          <FactTile v-if="group.budget !== null" :icon="Coins" label="Valor sugerido">{{ formatMoney(group.budget) }}</FactTile>
          <FactTile v-if="group.eventDate" :icon="CalendarDays" :label="eventCountdown(group.eventDate)" tone="paper" class="col-span-2">{{ formatEventDate(group.eventDate) }}</FactTile>
        </dl>
      </PageHeader>

      <!-- Passo 1: quem é você -->
      <div v-if="!selected" class="space-y-4">
        <h2 class="text-xl">Quem é você?</h2>
        <Empty v-if="group.members.length === 0" class="rounded-xl border border-dashed bg-card/50">
          <EmptyHeader>
            <EmptyTitle>Ninguém foi adicionado ainda</EmptyTitle>
            <EmptyDescription>O organizador ainda não cadastrou as pessoas. Volte mais tarde.</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <ul v-else class="grid gap-3 sm:grid-cols-2">
          <li v-for="person in group.members" :key="person.name">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm outline-none transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              @click="choose(person.name)"
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate font-semibold">{{ person.name }}</span>
                <span class="block text-sm text-muted-foreground">{{ person.hasPin ? 'Entrar com o PIN' : 'Criar o PIN' }}</span>
              </span>
              <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </div>

      <!-- Passo 2: criar o PIN (primeiro acesso) ou entrar com ele -->
      <Card v-else class="gap-0 overflow-hidden py-0">
        <div class="bg-primary/10 px-6 pb-6 pt-8 text-center">
          <h2 class="text-balance text-2xl sm:text-3xl">Olá, {{ firstName }}!</h2>
          <p class="mt-1 text-pretty text-muted-foreground">
            {{ isFirstAccess ? 'Crie um PIN de 4 números para abrir o seu amigo secreto.' : 'Digite o seu PIN para abrir o seu amigo secreto.' }}
          </p>
        </div>
        <CardContent class="p-6">
          <form class="space-y-6" @submit.prevent="onSubmit">
            <FieldGroup v-if="isFirstAccess">
              <Field class="items-center">
                <FieldLabel for="pin" class="justify-center">Crie um PIN</FieldLabel>
                <PinField id="pin" v-model="pin" label="Crie um PIN" centered large />
              </Field>
              <Field class="items-center">
                <FieldLabel for="pin-confirm" class="justify-center">Repita o PIN</FieldLabel>
                <PinField id="pin-confirm" v-model="pinConfirm" label="Repita o PIN" centered large />
                <FieldError v-if="pinConfirm && PIN_PATTERN.test(pin) && pin !== pinConfirm">Os PINs não são iguais.</FieldError>
              </Field>
              <Alert>
                <KeyRound aria-hidden="true" />
                <AlertDescription>Guarde o PIN: é ele que abre o seu amigo secreto. Se esquecer, peça ao organizador para zerar.</AlertDescription>
              </Alert>
              <Field v-if="group.status === 'open'">
                <FieldLabel>O que você gostaria de ganhar</FieldLabel>
                <WishlistEditor v-model="wishlist" />
              </Field>
            </FieldGroup>

            <Field v-else class="items-center">
              <FieldLabel for="pin" class="justify-center">Seu PIN</FieldLabel>
              <PinField id="pin" v-model="pin" label="Seu PIN" centered large />
            </Field>

            <FieldError v-if="formError" class="text-center">{{ formError }}</FieldError>
            <div class="space-y-2">
              <Button type="submit" size="lg" class="w-full" :disabled="!canSubmit">
                <Spinner v-if="submitting" />
                <Gift v-else aria-hidden="true" />
                {{ submitting ? 'Aguarde...' : isFirstAccess ? 'Criar PIN e abrir' : 'Abrir meu amigo secreto' }}
              </Button>
              <Button type="button" variant="ghost" size="lg" class="w-full" @click="choose(null)">Não sou {{ firstName }}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </template>
  </section>
</template>
