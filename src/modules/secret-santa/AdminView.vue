<script setup lang="ts">
import { Copy, Dices, KeyRound, MessageCircle, Trash2, TriangleAlert, UserPlus } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  addParticipant,
  drawGroup,
  getGroup,
  listParticipants,
  removeParticipant,
  resetPin,
  SantaApiError,
  type ParticipantSummary,
} from './lib/api'
import { adminUrl, inviteUrl, whatsappUrl } from './lib/links'
import { loadAdminToken, saveAdminToken } from './lib/session'

const route = useRoute()
const groupId = String(route.params.id)

type State = 'loading' | 'ready' | 'no-token' | 'forbidden' | 'not-found' | 'error'
const state = ref<State>('loading')
const errorMessage = ref('')
const status = ref<'open' | 'drawing' | 'drawn'>('open')
const participants = ref<ParticipantSummary[]>([])
const adminToken = ref('')
const groupName = ref('')
const confirmOpen = ref(false)
const drawing = ref(false)
const newName = ref('')
const adding = ref(false)
const newNameInput = ref<InstanceType<typeof Input> | null>(null)
/** Pessoa cujo PIN o organizador quer zerar (abre a confirmação). */
const resetTarget = ref<string | null>(null)
const resetting = ref(false)

const invite = computed(() => inviteUrl(window.location.origin, groupId))
const adminLink = computed(() => adminUrl(window.location.origin, groupId, adminToken.value))
const canDraw = computed(() => status.value === 'open' && participants.value.length >= 3)
const pendingCount = computed(() => participants.value.filter((p) => !p.hasPin).length)

/** Lê o token do fragmento (#t=...) e o guarda; depois tira o token da barra de endereço. */
function readToken(): string | null {
  const match = window.location.hash.match(/[#&]t=([^&]+)/)
  if (match) {
    saveAdminToken(groupId, match[1])
    window.history.replaceState(null, '', window.location.pathname)
    return match[1]
  }
  return loadAdminToken(groupId)
}

async function refresh() {
  try {
    const [result, group] = await Promise.all([
      listParticipants({ groupId, adminToken: adminToken.value }),
      getGroup(groupId),
    ])
    groupName.value = group.name
    status.value = result.status
    participants.value = result.participants
    state.value = 'ready'
  } catch (e) {
    if (e instanceof SantaApiError && e.code === 'FORBIDDEN') state.value = 'forbidden'
    else if (e instanceof SantaApiError && e.code === 'GROUP_NOT_FOUND') state.value = 'not-found'
    else {
      errorMessage.value = e instanceof SantaApiError ? e.message : 'Não foi possível abrir o painel.'
      state.value = 'error'
    }
  }
}

onMounted(async () => {
  const token = readToken()
  if (!token) {
    state.value = 'no-token'
    return
  }
  adminToken.value = token
  await refresh()
})

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copiado.`)
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
  }
}

async function onAdd() {
  const name = newName.value.trim()
  if (!name) return
  adding.value = true
  try {
    await addParticipant({ groupId, adminToken: adminToken.value, name })
    newName.value = ''
    toast.success(`${name} foi adicionado.`)
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível adicionar.')
  } finally {
    adding.value = false
    // Mantém o foco no campo para cadastrar a próxima pessoa em sequência.
    ;(newNameInput.value?.$el as HTMLInputElement | undefined)?.focus()
  }
}

async function onReset() {
  const name = resetTarget.value
  if (!name) return
  resetting.value = true
  try {
    await resetPin({ groupId, adminToken: adminToken.value, name })
    toast.success(`PIN de ${name} zerado. A pessoa cria um novo no próximo acesso.`)
    resetTarget.value = null
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível zerar o PIN.')
  } finally {
    resetting.value = false
  }
}

async function onRemove(name: string) {
  try {
    await removeParticipant({ groupId, adminToken: adminToken.value, name })
    toast.success(`${name} saiu do grupo.`)
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível remover.')
  }
}

async function onDraw() {
  drawing.value = true
  try {
    await drawGroup({ groupId, adminToken: adminToken.value })
    confirmOpen.value = false
    toast.success('Sorteio feito. Avise o grupo para ver quem tirou.')
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível sortear.')
  } finally {
    drawing.value = false
  }
}
</script>

<template>
  <section class="mx-auto w-full max-w-md space-y-8">
    <p v-if="state === 'loading'" class="py-12 text-center text-muted-foreground">Abrindo o painel...</p>

    <div v-else-if="state === 'no-token' || state === 'forbidden'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Link de administração necessário</h1>
      <p class="text-muted-foreground">
        Abra o link de administração que apareceu quando você criou o grupo. Sem ele, não dá para sortear nem remover pessoas.
      </p>
      <Button class="h-11" as-child size="lg"><RouterLink :to="`/secret-santa/g/${groupId}`">Ir para o convite</RouterLink></Button>
    </div>

    <div v-else-if="state === 'not-found'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Grupo não encontrado</h1>
      <Button class="h-11" as-child size="lg"><RouterLink to="/secret-santa">Criar um grupo</RouterLink></Button>
    </div>

    <div v-else-if="state === 'error'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Não foi possível abrir o painel</h1>
      <p class="text-muted-foreground">{{ errorMessage }}</p>
      <Button class="h-11" size="lg" @click="refresh">Tentar de novo</Button>
    </div>

    <template v-else>
      <header class="space-y-1">
        <p class="text-sm text-muted-foreground">Painel do organizador</p>
        <h1 class="font-display text-3xl leading-tight">{{ groupName }}</h1>
        <p class="text-muted-foreground">
          {{
            status === 'drawn'
              ? 'O sorteio foi feito. Quem ainda não acessou pode criar o PIN e ver quem tirou.'
              : 'Adicione as pessoas e mande o link do grupo. Cada uma escolhe o próprio nome e cria o PIN.'
          }}
        </p>
      </header>

      <div class="space-y-3">
        <h2 class="font-display text-xl">Convite</h2>
        <div class="flex gap-2">
          <Input class="h-11" :model-value="invite" readonly aria-label="Link do convite" />
          <Button class="size-11" variant="secondary" size="icon" aria-label="Copiar convite" @click="copy(invite, 'Convite')">
            <Copy class="size-4" aria-hidden="true" />
          </Button>
        </div>
        <Button as-child variant="outline" size="lg" class="w-full h-11">
          <a :href="whatsappUrl(groupName, invite)" target="_blank" rel="noopener noreferrer">
            <MessageCircle class="size-4" aria-hidden="true" />
            Enviar pelo WhatsApp
          </a>
        </Button>
      </div>

      <div class="space-y-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
        <p class="flex items-center gap-2 font-semibold"><TriangleAlert class="size-4" aria-hidden="true" />Guarde o link de administração</p>
        <p class="text-sm text-muted-foreground">É o único jeito de voltar a este painel em outro aparelho. Não envie para o grupo.</p>
        <Button class="h-11" variant="outline" size="sm" @click="copy(adminLink, 'Link de administração')">
          <Copy class="size-4" aria-hidden="true" />
          Copiar link de administração
        </Button>
      </div>

      <div class="space-y-3">
        <h2 class="font-display text-xl">Pessoas ({{ participants.length }})</h2>
        <form v-if="status === 'open'" class="flex gap-2" @submit.prevent="onAdd">
          <Input
            ref="newNameInput"
            v-model="newName"
            class="h-11"
            maxlength="60"
            autocomplete="off"
            placeholder="Nome da pessoa"
            aria-label="Nome da pessoa"
          />
          <Button type="submit" class="h-11 shrink-0" :disabled="adding || !newName.trim()">
            <UserPlus class="size-4" aria-hidden="true" />
            Adicionar
          </Button>
        </form>
        <p v-if="participants.length === 0" class="text-muted-foreground">Ninguém foi adicionado ainda.</p>
        <template v-else>
          <p class="text-sm text-muted-foreground">
            {{ participants.length - pendingCount }} de {{ participants.length }} já criaram o PIN.
          </p>
          <ul class="divide-y rounded-lg bg-card">
            <li v-for="person in participants" :key="person.name" class="flex items-center justify-between gap-2 py-1 pl-4 pr-1">
              <div class="min-w-0">
                <p class="truncate">
                  {{ person.name }}<span v-if="person.isOrganizer" class="ml-2 text-sm text-muted-foreground">(você)</span>
                </p>
                <p class="text-sm" :class="person.hasPin ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-400'">
                  {{ person.hasPin ? 'PIN criado' : 'Ainda não acessou' }}
                </p>
              </div>
              <div class="flex shrink-0">
                <Button
                  v-if="person.hasPin"
                  class="size-11"
                  variant="ghost"
                  size="icon"
                  :aria-label="`Zerar PIN de ${person.name}`"
                  @click="resetTarget = person.name"
                >
                  <KeyRound class="size-4" aria-hidden="true" />
                </Button>
                <Button
                  v-if="status === 'open'"
                  class="size-11"
                  variant="ghost"
                  size="icon"
                  :aria-label="`Remover ${person.name}`"
                  @click="onRemove(person.name)"
                >
                  <Trash2 class="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          </ul>
        </template>
        <Button class="h-11" variant="ghost" size="sm" @click="refresh">Atualizar lista</Button>
      </div>

      <div v-if="status === 'open'" class="space-y-2">
        <Button size="lg" class="w-full h-11" :disabled="!canDraw" @click="confirmOpen = true">
          <Dices class="size-4" aria-hidden="true" />
          Sortear
        </Button>
        <p v-if="!canDraw" class="text-sm text-muted-foreground">São necessárias pelo menos 3 pessoas para sortear.</p>
        <p v-else-if="pendingCount > 0" class="text-sm text-muted-foreground">
          {{ pendingCount === 1 ? '1 pessoa ainda não criou' : `${pendingCount} pessoas ainda não criaram` }} o PIN. Dá para
          sortear assim mesmo: quem não criou cria depois e vê quem tirou.
        </p>
      </div>

      <Dialog v-model:open="confirmOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sortear agora?</DialogTitle>
            <DialogDescription>
              Depois do sorteio não dá para adicionar nem remover pessoas, nem mudar a lista de desejos. Não dá para desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button class="h-11" variant="outline" @click="confirmOpen = false">Cancelar</Button>
            <Button class="h-11" :disabled="drawing" @click="onDraw">{{ drawing ? 'Sorteando...' : 'Sortear' }}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog :open="resetTarget !== null" @update:open="(open: boolean) => !open && (resetTarget = null)">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zerar o PIN de {{ resetTarget }}?</DialogTitle>
            <DialogDescription>
              A pessoa vai criar um PIN novo no próximo acesso. O par do sorteio não muda.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button class="h-11" variant="outline" @click="resetTarget = null">Cancelar</Button>
            <Button class="h-11" :disabled="resetting" @click="onReset">{{ resetting ? 'Zerando...' : 'Zerar PIN' }}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </template>
  </section>
</template>
