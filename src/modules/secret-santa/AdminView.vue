<script setup lang="ts">
import { Copy, Dices, Gift, KeyRound, Link2, LogOut, MessageCircle, Trash2, UserPlus } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
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
import { loadUser, logout, useAuth } from '@/core/services/auth'
import AuthForm from './components/AuthForm.vue'
import {
  addParticipant,
  deleteGroup,
  drawGroup,
  getGroup,
  listParticipants,
  removeParticipant,
  resetPin,
  SantaApiError,
  setSlug,
  type ParticipantSummary,
} from './lib/api'
import { slugifyInput, trimSlug } from './lib/slug'
import { adminPath, inviteUrl, mePath, whatsappUrl } from './lib/links'
import { loadCredentials, saveCredentials } from './lib/session'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
/** Id ou endereço amigável, como veio da URL. */
const groupId = ref(String(route.params.id))

type State = 'loading' | 'ready' | 'login' | 'forbidden' | 'not-found' | 'error'
const state = ref<State>('loading')
const errorMessage = ref('')
const status = ref<'open' | 'drawing' | 'drawn'>('open')
const participants = ref<ParticipantSummary[]>([])
const groupName = ref('')
const slug = ref<string | null>(null)
const slugDraft = ref('')
const savingSlug = ref(false)
const confirmOpen = ref(false)
const drawing = ref(false)
const newName = ref('')
const adding = ref(false)
const newNameInput = ref<InstanceType<typeof Input> | null>(null)
/** Pessoa cujo PIN o organizador quer zerar (abre a confirmação). */
const resetTarget = ref<string | null>(null)
const resetting = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)

const origin = window.location.origin
const invite = computed(() => inviteUrl(window.location.origin, groupId.value, slug.value))
const hasMyself = computed(() => participants.value.some((p) => p.isOrganizer))
const canDraw = computed(() => status.value === 'open' && participants.value.length >= 3)
const pendingCount = computed(() => participants.value.filter((p) => !p.hasPin).length)

async function refresh() {
  try {
    const [result, group] = await Promise.all([
      listParticipants({ groupId: groupId.value }),
      getGroup(groupId.value),
    ])
    groupId.value = group.id
    groupName.value = group.name
    slug.value = group.slug
    slugDraft.value ||= group.slug ?? ''
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
  await loadUser()
  if (!user.value) {
    state.value = 'login'
    return
  }
  await refresh()
})

async function onLoggedIn() {
  state.value = 'loading'
  await refresh()
}

async function onLogout() {
  await logout()
  await router.push('/secret-santa')
}

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
    await addParticipant({ groupId: groupId.value, name })
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

function onSlugInput(event: Event) {
  const input = event.target as HTMLInputElement
  slugDraft.value = slugifyInput(input.value)
  input.value = slugDraft.value
}

async function onSaveSlug() {
  slugDraft.value = trimSlug(slugDraft.value)
  savingSlug.value = true
  try {
    const result = await setSlug({ groupId: groupId.value, slug: slugDraft.value })
    slug.value = result.slug
    slugDraft.value = result.slug
    toast.success('Link atualizado. O convite agora usa esse texto.')
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível salvar o texto do link.')
  } finally {
    savingSlug.value = false
  }
}

async function onReset() {
  const name = resetTarget.value
  if (!name) return
  resetting.value = true
  try {
    await resetPin({ groupId: groupId.value, name })
    toast.success(`PIN de ${name} zerado. A pessoa cria um novo no próximo acesso.`)
    resetTarget.value = null
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível zerar o PIN.')
  } finally {
    resetting.value = false
  }
}

async function onDeleteGroup() {
  deleting.value = true
  try {
    await deleteGroup({ groupId: groupId.value })
    toast.success('Grupo excluído.')
    deleteOpen.value = false
    await router.push('/secret-santa')
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível excluir o grupo.')
  } finally {
    deleting.value = false
  }
}

async function onRemove(name: string) {
  try {
    await removeParticipant({ groupId: groupId.value, name })
    toast.success(`${name} saiu do grupo.`)
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível remover.')
  }
}

async function onDraw() {
  drawing.value = true
  try {
    await drawGroup({ groupId: groupId.value })
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

    <div v-else-if="state === 'login'" class="space-y-6 py-8">
      <AuthForm @done="onLoggedIn" />
    </div>

    <div v-else-if="state === 'forbidden'" class="space-y-4 py-12">
      <h1 class="font-display text-3xl leading-tight">Este grupo é de outra conta</h1>
      <p class="text-muted-foreground">
        Só quem criou o grupo administra. Você está como {{ user?.email }}. Entre com a conta certa para abrir o painel.
      </p>
      <div class="flex flex-wrap gap-3">
        <Button class="h-11" size="lg" @click="onLogout">Trocar de conta</Button>
        <Button class="h-11" as-child size="lg" variant="outline"><RouterLink :to="`/secret-santa/g/${groupId}`">Ir para o convite</RouterLink></Button>
      </div>
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
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-muted-foreground">Painel do organizador</p>
          <div class="flex items-center gap-1">
            <Button as-child variant="ghost" size="sm"><RouterLink to="/secret-santa">Meus grupos</RouterLink></Button>
            <Button variant="ghost" size="sm" @click="onLogout">
              <LogOut class="size-4" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
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
          <Button class="size-11" variant="outline" size="icon" aria-label="Copiar convite" @click="copy(invite, 'Convite')">
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

      <div v-if="status === 'drawn' && hasMyself" class="rounded-lg border border-secondary/60 bg-secondary/10 p-4">
        <p class="mb-3 font-semibold">O sorteio foi feito!</p>
        <Button as-child size="lg" class="h-11 w-full" variant="secondary">
          <RouterLink :to="mePath(String(route.params.id))">
            <Gift class="size-4" aria-hidden="true" />
            Ver meu amigo
          </RouterLink>
        </Button>
      </div>

      <form class="space-y-2" @submit.prevent="onSaveSlug">
        <h2 class="flex items-center gap-2 font-display text-xl"><Link2 class="size-5" aria-hidden="true" />Texto do link</h2>
        <p class="text-sm text-muted-foreground">Opcional. Deixa o link mais bonito, como <span class="font-medium">familia-da-bagunca</span>. Pode repetir o de outros grupos.</p>
        <div class="flex gap-2">
          <Input :value="slugDraft" class="h-11" maxlength="40" autocomplete="off" placeholder="familia-da-bagunca" aria-label="Texto do link" @input="onSlugInput" @blur="slugDraft = trimSlug(slugDraft)" />
          <Button type="submit" class="h-11 shrink-0" :disabled="savingSlug || slugDraft.trim().length < 3">Salvar</Button>
        </div>
        <p class="break-all text-sm text-muted-foreground">{{ inviteUrl(origin, groupId, slugDraft ? trimSlug(slugDraft) : null) }}</p>
      </form>

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
                <p class="text-sm" :class="person.hasPin ? 'text-muted-foreground' : 'text-warning'">
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

      <div class="space-y-2 rounded-lg border border-destructive/40 p-4">
        <h2 class="font-display text-xl">Excluir grupo</h2>
        <p class="text-sm text-muted-foreground">
          Apaga o grupo, as pessoas, as perguntas e o mural. Não dá para desfazer.
        </p>
        <Button class="h-11" variant="destructive" @click="deleteOpen = true">
          <Trash2 class="size-4" aria-hidden="true" />
          Excluir grupo
        </Button>
      </div>

      <Dialog v-model:open="deleteOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir "{{ groupName }}"?</DialogTitle>
            <DialogDescription>
              Todas as pessoas cadastradas, o sorteio, as perguntas anônimas e os recados do mural serão apagados para sempre.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button class="h-11" variant="outline" @click="deleteOpen = false">Cancelar</Button>
            <Button class="h-11" variant="destructive" :disabled="deleting" @click="onDeleteGroup">
              {{ deleting ? 'Excluindo...' : 'Excluir tudo' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
