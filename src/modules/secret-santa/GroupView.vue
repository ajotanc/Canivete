<script setup lang="ts">
import { CalendarDays, Coins, Users } from '@lucide/vue'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getGroup, joinGroup, revealMatch, SantaApiError, type GroupInfo } from './lib/api'
import { mePath } from './lib/links'
import { saveCredentials } from './lib/session'

const route = useRoute()
const router = useRouter()
const groupId = String(route.params.id)

type State = 'loading' | 'ready' | 'not-found' | 'error'
const state = ref<State>('loading')
const group = ref<GroupInfo | null>(null)
const errorMessage = ref('')

const mode = ref<'join' | 'return'>('join')
const name = ref('')
const pin = ref('')
const wishlist = ref('')
const submitting = ref(false)
const formError = ref('')

onMounted(async () => {
  try {
    group.value = await getGroup(groupId)
    state.value = 'ready'
    if (group.value.status !== 'open') mode.value = 'return'
  } catch (e) {
    if (e instanceof SantaApiError && e.code === 'GROUP_NOT_FOUND') {
      state.value = 'not-found'
    } else {
      errorMessage.value = e instanceof SantaApiError ? e.message : 'Não foi possível abrir o grupo.'
      state.value = 'error'
    }
  }
})

/** "2026-12-24" vira "24 de dezembro de 2026". */
function formatDate(iso: string): string {
  return dayjs(iso).locale('pt-br').format('D [de] MMMM [de] YYYY')
}

async function onSubmit() {
  formError.value = ''
  submitting.value = true
  try {
    if (mode.value === 'join') {
      await joinGroup({ groupId, name: name.value, pin: pin.value, wishlist: wishlist.value })
      toast.success('Você entrou no grupo!')
    } else {
      // Confere nome e PIN antes de seguir para o painel.
      await revealMatch({ groupId, name: name.value, pin: pin.value })
    }
    saveCredentials(groupId, { name: name.value, pin: pin.value })
    await router.push(mePath(groupId))
  } catch (e) {
    formError.value = e instanceof SantaApiError ? e.message : 'Não foi possível continuar.'
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
      <Button as-child size="lg"><RouterLink to="/secret-santa">Criar um grupo</RouterLink></Button>
    </div>

    <div v-else-if="state === 'error'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Não foi possível abrir o grupo</h1>
      <p class="text-muted-foreground">{{ errorMessage }}</p>
      <Button size="lg" @click="$router.go(0)">Tentar de novo</Button>
    </div>

    <template v-else-if="group">
      <header class="space-y-3">
        <h1 class="font-display text-3xl leading-tight">{{ group.name }}</h1>
        <ul class="space-y-1 text-muted-foreground">
          <li class="flex items-center gap-2"><Users class="size-4" aria-hidden="true" />{{ group.participantCount }} {{ group.participantCount === 1 ? 'pessoa' : 'pessoas' }}</li>
          <li v-if="group.budget" class="flex items-center gap-2"><Coins class="size-4" aria-hidden="true" />{{ group.budget }}</li>
          <li v-if="group.eventDate" class="flex items-center gap-2"><CalendarDays class="size-4" aria-hidden="true" />{{ formatDate(group.eventDate) }}</li>
        </ul>
        <p v-if="group.status !== 'open'" class="rounded-lg bg-primary/10 p-3 text-sm">
          Este grupo já foi sorteado. Entre com seu nome e PIN para ver quem você tirou.
        </p>
      </header>

      <div v-if="group.status === 'open'" class="flex gap-2" role="tablist">
        <Button :variant="mode === 'join' ? 'default' : 'outline'" role="tab" :aria-selected="mode === 'join'" @click="mode = 'join'">Entrar no grupo</Button>
        <Button :variant="mode === 'return' ? 'default' : 'outline'" role="tab" :aria-selected="mode === 'return'" @click="mode = 'return'">Já entrei</Button>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="space-y-2">
          <Label for="name">Seu nome</Label>
          <Input id="name" v-model="name" maxlength="60" autocomplete="off" />
        </div>
        <div class="space-y-2">
          <Label for="pin">{{ mode === 'join' ? 'Crie um PIN (4 a 6 números)' : 'Seu PIN' }}</Label>
          <Input id="pin" v-model="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" />
          <p v-if="mode === 'join'" class="text-sm text-muted-foreground">Você vai usar o PIN para ver quem tirou. Anote, não dá para recuperar.</p>
        </div>
        <div v-if="mode === 'join'" class="space-y-2">
          <Label for="wishlist">O que você gostaria de ganhar</Label>
          <Textarea id="wishlist" v-model="wishlist" maxlength="500" rows="3" />
        </div>
        <p v-if="formError" class="text-sm text-destructive" role="alert">{{ formError }}</p>
        <Button type="submit" size="lg" class="w-full" :disabled="submitting || !name.trim() || !/^\d{4,6}$/.test(pin)">
          {{ submitting ? 'Aguarde...' : mode === 'join' ? 'Entrar no grupo' : 'Ver meu painel' }}
        </Button>
      </form>
    </template>
  </section>
</template>
