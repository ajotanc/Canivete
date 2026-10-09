<script setup lang="ts">
import { CalendarDays, ChevronRight, Coins, Gift, KeyRound, Search, SearchX, TriangleAlert, Users } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import HeaderSkeleton from '@/components/skeletons/HeaderSkeleton.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { santaCoverUrl } from '@/core/services/appwrite'
import PinField from '@/components/PinField.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import EmptyState from '@/components/EmptyState.vue'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { formatMoneyShort } from '@/lib/money'
import AddToCalendar from './components/AddToCalendar.vue'
import WishlistEditor from './components/WishlistEditor.vue'
import { applyGroupColor } from './lib/groupColor'
import { getGroup, revealMatch, SantaApiError, setupPin, type GroupInfo, type WishItem } from './lib/api'
import { eventCountdown, formatEventDate } from './lib/event'
import { mePath } from './lib/links'
import { NAME_SEARCH_FROM, PIN_LENGTH } from './constants'
import { isPin } from './lib/pin'
import { loadCredentials, saveCredentials } from './lib/session'

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

/** Primeiro nome de quem escolheu, para falar de forma mais próxima. */
const firstName = computed(() => (selected.value ?? '').split(' ')[0])

/** Lista longa ganha um filtro por nome; "João" e "joao" se encontram. */
const query = ref('')
const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const visibleMembers = computed(() => {
  const needle = plain(query.value.trim())
  return (group.value?.members ?? []).filter((m) => plain(m.name).includes(needle))
})

/** Quem já entrou nesta aba (e voltou do painel) continua de onde parou, sem escolher o nome de novo. */
const returning = computed(() => {
  const saved = loadCredentials(groupId)
  const person = group.value?.members.find((m) => m.name === saved?.name)
  return person && person.hasPin ? person.name : null
})

const member = computed(() => group.value?.members.find((m) => m.name === selected.value) ?? null)
/** Primeiro acesso: a pessoa ainda não criou o PIN. */
const isFirstAccess = computed(() => member.value !== null && !member.value.hasPin)
const canSubmit = computed(() => {
  if (submitting.value || !isPin(pin.value)) return false
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
  const wanted = route.query.person
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
    <div v-if="state === 'loading'" class="space-y-8" role="status" aria-label="Abrindo o grupo">
      <HeaderSkeleton />
      <div class="space-y-4">
        <Skeleton class="h-6 w-44" />
        <div class="grid gap-3 sm:grid-cols-2">
          <Skeleton v-for="n in 3" :key="n" class="h-[74px] rounded-2xl" />
        </div>
      </div>
    </div>

    <EmptyState v-else-if="state === 'not-found'" page :icon="SearchX" description="Grupo não encontrado. Confira se o link do convite está completo.">
      <Button as-child size="lg"><RouterLink to="/secret-santa">Criar um grupo</RouterLink></Button>
    </EmptyState>

    <EmptyState v-else-if="state === 'error'" page :icon="TriangleAlert" :description="`Não foi possível abrir o grupo. ${errorMessage}`">
      <Button size="lg" @click="$router.go(0)">Tentar de novo</Button>
    </EmptyState>

    <template v-else-if="group">
      <PageHeader
        filled
        :icon="Gift"
        :image="santaCoverUrl(group.cover)"
        :title="group.name"
        :description="
          group.status === 'open'
            ? 'Você foi convidado. Escolha seu nome e crie um PIN para participar.'
            : 'O sorteio já foi feito. Escolha seu nome para ver quem você tirou.'
        "
      >
        <FactList>
          <FactTile :icon="Users" label="Pessoas">{{ group.participantCount }}</FactTile>
          <FactTile :icon="Coins" label="Valor sugerido">{{ group.budget !== null ? formatMoneyShort(group.budget) : 'A definir' }}</FactTile>
          <FactTile :icon="CalendarDays" :label="group.eventDate ? eventCountdown(group.eventDate) : 'Data da troca'" tone="paper">{{ group.eventDate ? formatEventDate(group.eventDate) : 'A combinar' }}</FactTile>
        </FactList>
        <div v-if="(returning && !selected) || group.eventDate" class="-ml-3 flex flex-wrap gap-2">
          <Button v-if="returning && !selected" as-child variant="ghost" size="sm">
            <RouterLink :to="mePath(groupId)"><Gift aria-hidden="true" />Continuar como {{ returning.split(' ')[0] }}</RouterLink>
          </Button>
          <AddToCalendar v-if="group.eventDate" :group-id="groupId" :group-name="group.name" :event-date="group.eventDate" />
        </div>
      </PageHeader>

      <!-- Passo 1: quem é você -->
      <div v-if="!selected" class="space-y-4">
        <h2 class="text-xl">{{ returning ? 'Ou entre como outra pessoa' : 'Quem é você?' }}</h2>
        <EmptyState v-if="group.members.length === 0" :icon="Users" description="O organizador ainda não cadastrou ninguém. Volte mais tarde." />
        <InputGroup v-if="group.members.length >= NAME_SEARCH_FROM" class="h-11 bg-card">
          <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput v-model="query" type="search" autocomplete="off" placeholder="Buscar seu nome" aria-label="Buscar seu nome" />
        </InputGroup>
        <p v-if="group.members.length > 0 && visibleMembers.length === 0" class="text-sm text-muted-foreground" role="status">
          Ninguém com esse nome. Confira como o organizador escreveu o seu.
        </p>
        <ul v-else-if="group.members.length > 0" class="grid gap-3 sm:grid-cols-2">
          <li v-for="person in visibleMembers" :key="person.name">
            <button
              type="button"
              class="group flex w-full items-center gap-3 rounded-2xl border bg-card p-3 pr-4 text-left shadow-sm outline-none transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              @click="choose(person.name)"
            >
              <span class="flex size-11 shrink-0 items-center justify-center rounded-chip border border-primary/20 bg-primary/10 text-lg font-semibold text-primary" aria-hidden="true">{{ person.name.charAt(0).toUpperCase() }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate font-semibold">{{ person.name }}</span>
                <span class="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <KeyRound class="size-3.5" aria-hidden="true" />{{ person.hasPin ? 'Entrar com o PIN' : 'Criar o PIN' }}
                </span>
              </span>
              <ChevronRight class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </div>

      <!-- Passo 2: criar o PIN (primeiro acesso) ou entrar com ele -->
      <Card v-else class="gap-0 overflow-hidden py-0">
        <div class="bg-primary/10 px-6 pb-6 pt-8 text-center">
          <h2 class="text-balance text-2xl sm:text-3xl">Olá, {{ firstName }}!</h2>
          <p class="mt-1 text-pretty text-muted-foreground">
            {{ isFirstAccess ? `Crie um PIN de ${PIN_LENGTH} números para abrir o seu amigo secreto.` : 'Digite o seu PIN para abrir o seu amigo secreto.' }}
          </p>
        </div>
        <CardContent class="p-6">
          <form class="space-y-6" @submit.prevent="onSubmit">
            <FieldGroup v-if="isFirstAccess">
              <Field class="items-center">
                <FieldLabel for="pin" class="justify-center">Crie um PIN</FieldLabel>
                <PinField id="pin" v-model="pin" :length="PIN_LENGTH" label="Crie um PIN" centered large />
              </Field>
              <Field class="items-center">
                <FieldLabel for="pin-confirm" class="justify-center">Repita o PIN</FieldLabel>
                <PinField id="pin-confirm" v-model="pinConfirm" :length="PIN_LENGTH" label="Repita o PIN" centered large />
                <FieldError v-if="pinConfirm && isPin(pin) && pin !== pinConfirm">Os PINs não são iguais.</FieldError>
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
              <PinField id="pin" v-model="pin" :length="PIN_LENGTH" label="Seu PIN" centered large />
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
