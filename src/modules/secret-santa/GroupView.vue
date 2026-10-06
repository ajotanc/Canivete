<script setup lang="ts">
import { CalendarDays, Coins, Users } from '@lucide/vue'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TagInput from '@/components/TagInput.vue'
import { formatMoney } from '@/lib/money'
import { getGroup, revealMatch, SantaApiError, setupPin, type GroupInfo } from './lib/api'
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
const wishlist = ref<string[]>([])
const submitting = ref(false)
const formError = ref('')

const PIN_PATTERN = /^\d{4,6}$/

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

onMounted(load)

/** "2026-12-24" vira "24 de dezembro de 2026". */
function formatDate(iso: string): string {
  return dayjs(iso).locale('pt-br').format('D [de] MMMM [de] YYYY')
}

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
  <section class="mx-auto w-full max-w-md space-y-8">
    <p v-if="state === 'loading'" class="py-12 text-center text-muted-foreground">Abrindo o grupo...</p>

    <div v-else-if="state === 'not-found'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Grupo não encontrado</h1>
      <p class="text-muted-foreground">Confira se o link do convite está completo.</p>
      <Button class="h-11" as-child size="lg"><RouterLink to="/secret-santa">Criar um grupo</RouterLink></Button>
    </div>

    <div v-else-if="state === 'error'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Não foi possível abrir o grupo</h1>
      <p class="text-muted-foreground">{{ errorMessage }}</p>
      <Button class="h-11" size="lg" @click="$router.go(0)">Tentar de novo</Button>
    </div>

    <template v-else-if="group">
      <header class="space-y-3">
        <h1 class="font-display text-3xl leading-tight">{{ group.name }}</h1>
        <ul class="space-y-1 text-muted-foreground">
          <li class="flex items-center gap-2"><Users class="size-4" aria-hidden="true" />{{ group.participantCount }} {{ group.participantCount === 1 ? 'pessoa' : 'pessoas' }}</li>
          <li v-if="group.budget !== null" class="flex items-center gap-2"><Coins class="size-4" aria-hidden="true" />{{ formatMoney(group.budget) }}</li>
          <li v-if="group.eventDate" class="flex items-center gap-2"><CalendarDays class="size-4" aria-hidden="true" />{{ formatDate(group.eventDate) }}</li>
        </ul>
        <p v-if="group.status !== 'open'" class="rounded-lg bg-primary/10 p-3 text-sm">
          O sorteio já foi feito. Escolha seu nome e entre para ver quem você tirou.
        </p>
      </header>

      <!-- Passo 1: quem é você -->
      <div v-if="!selected" class="space-y-3">
        <h2 class="font-display text-2xl leading-tight">Quem é você?</h2>
        <p v-if="group.members.length === 0" class="text-muted-foreground">
          O organizador ainda não adicionou ninguém. Volte mais tarde.
        </p>
        <ul v-else class="grid grid-cols-2 gap-2">
          <li v-for="person in group.members" :key="person.name">
            <Button variant="outline" class="h-11 w-full justify-start truncate" @click="choose(person.name)">
              {{ person.name }}
            </Button>
          </li>
        </ul>
      </div>

      <!-- Passo 2: criar o PIN (primeiro acesso) ou entrar com ele -->
      <form v-else class="space-y-4" @submit.prevent="onSubmit">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 space-y-1">
            <h2 class="truncate font-display text-2xl leading-tight">Olá, {{ selected }}!</h2>
            <p class="text-muted-foreground">{{ isFirstAccess ? 'Crie seu PIN para entrar.' : 'Digite seu PIN para entrar.' }}</p>
          </div>
          <Button type="button" variant="ghost" class="h-11 shrink-0" @click="choose(null)">Não sou eu</Button>
        </div>

        <template v-if="isFirstAccess">
          <p class="text-sm text-muted-foreground">
            É seu primeiro acesso. O PIN tem de 4 a 6 números e serve para ver quem você tirou. Se esquecer, peça ao organizador para zerar.
          </p>
          <div class="space-y-2">
            <Label for="pin">Crie um PIN</Label>
            <Input id="pin" v-model="pin" v-maska data-maska="######" class="h-11 [-webkit-text-security:disc]" type="text" inputmode="numeric" autocomplete="off" data-1p-ignore data-lpignore="true" />
          </div>
          <div class="space-y-2">
            <Label for="pin-confirm">Repita o PIN</Label>
            <Input id="pin-confirm" v-model="pinConfirm" v-maska data-maska="######" class="h-11 [-webkit-text-security:disc]" type="text" inputmode="numeric" autocomplete="off" data-1p-ignore data-lpignore="true" />
            <p v-if="pinConfirm && PIN_PATTERN.test(pin) && pin !== pinConfirm" class="text-sm text-destructive">Os PINs não são iguais.</p>
          </div>
          <div v-if="group.status === 'open'" class="space-y-2">
            <Label for="wishlist">O que você gostaria de ganhar</Label>
            <TagInput id="wishlist" v-model="wishlist" placeholder="Digite um item e aperte Enter" />
          </div>
        </template>

        <div v-else class="space-y-2">
          <Label for="pin">Seu PIN</Label>
          <Input id="pin" v-model="pin" v-maska data-maska="######" class="h-11 [-webkit-text-security:disc]" type="text" inputmode="numeric" autocomplete="off" data-1p-ignore data-lpignore="true" />
        </div>

        <p v-if="formError" class="text-sm text-destructive" role="alert">{{ formError }}</p>
        <Button type="submit" size="lg" class="h-11 w-full" :disabled="!canSubmit">
          {{ submitting ? 'Aguarde...' : isFirstAccess ? 'Criar PIN e entrar' : 'Entrar' }}
        </Button>
      </form>
    </template>
  </section>
</template>
