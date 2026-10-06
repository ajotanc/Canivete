<script setup lang="ts">
import { Copy, Dices, Gift, KeyRound, Link2, MessageCircle, Trash2, TriangleAlert, UserPlus } from '@lucide/vue'
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
import {
  addParticipant,
  drawGroup,
  getGroup,
  listParticipants,
  removeParticipant,
  resetPin,
  SantaApiError,
  setSlug,
  type ParticipantSummary,
} from './lib/api'
import { adminPath, adminUrl, inviteUrl, mePath, whatsappUrl } from './lib/links'
import { loadAdminToken, loadCredentials, saveAdminToken, saveCredentials } from './lib/session'

const route = useRoute()
const router = useRouter()
/** Id ou endereço amigável, como veio da URL. */
const groupId = ref(String(route.params.id))

type State = 'loading' | 'ready' | 'no-token' | 'forbidden' | 'not-found' | 'error'
const state = ref<State>('loading')
const errorMessage = ref('')
const status = ref<'open' | 'drawing' | 'drawn'>('open')
const participants = ref<ParticipantSummary[]>([])
const adminToken = ref('')
const groupName = ref('')
const slug = ref<string | null>(null)
const slugDraft = ref('')
const slugSuggestions = ref<string[]>([])
const savingSlug = ref(false)
const confirmOpen = ref(false)
const drawing = ref(false)
const newName = ref('')
const adding = ref(false)
const newNameInput = ref<InstanceType<typeof Input> | null>(null)
/** Pessoa cujo PIN o organizador quer zerar (abre a confirmação). */
const resetTarget = ref<string | null>(null)
const resetting = ref(false)

const invite = computed(() => inviteUrl(window.location.origin, slug.value ?? groupId.value))
const hasMyself = computed(() => participants.value.some((p) => p.isOrganizer))
const adminLink = computed(() => adminUrl(window.location.origin, slug.value ?? groupId.value, adminToken.value))
const canDraw = computed(() => status.value === 'open' && participants.value.length >= 3)
const pendingCount = computed(() => participants.value.filter((p) => !p.hasPin).length)

/** Lê o token do fragmento (#t=...) e o guarda; depois tira o token da barra de endereço. */
function readToken(): string | null {
  const match = window.location.hash.match(/[#&]t=([^&]+)/)
  if (match) {
    saveAdminToken(groupId.value, match[1])
    window.history.replaceState(null, '', window.location.pathname)
    return match[1]
  }
  return loadAdminToken(groupId.value)
}

async function refresh() {
  try {
    const [result, group] = await Promise.all([
      listParticipants({ groupId: groupId.value, adminToken: adminToken.value }),
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
  // Sem token neste aparelho, tenta mesmo assim: quem criou o grupo nesta sessão é reconhecido como dono.
  adminToken.value = readToken() ?? ''
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
    await addParticipant({ groupId: groupId.value, adminToken: adminToken.value, name })
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

async function onSaveSlug() {
  savingSlug.value = true
  slugSuggestions.value = []
  try {
    const result = await setSlug({ groupId: groupId.value, adminToken: adminToken.value, slug: slugDraft.value })
    slug.value = result.slug
    slugDraft.value = result.slug
    toast.success('Endereço salvo. O convite agora usa ele.')
    // A URL do painel muda com o endereço; leva o token junto para a nova chave.
    if (adminToken.value) saveAdminToken(result.slug, adminToken.value)
    const credentials = loadCredentials(String(route.params.id)) ?? loadCredentials(groupId.value)
    if (credentials) saveCredentials(result.slug, credentials)
    await router.replace(adminPath(result.slug))
  } catch (e) {
    if (e instanceof SantaApiError && e.code === 'SLUG_TAKEN') {
      slugSuggestions.value = Array.isArray(e.details?.suggestions) ? (e.details.suggestions as string[]) : []
    }
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível salvar o endereço.')
  } finally {
    savingSlug.value = false
  }
}

async function onReset() {
  const name = resetTarget.value
  if (!name) return
  resetting.value = true
  try {
    await resetPin({ groupId: groupId.value, adminToken: adminToken.value, name })
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
    await removeParticipant({ groupId: groupId.value, adminToken: adminToken.value, name })
    toast.success(`${name} saiu do grupo.`)
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível remover.')
  }
}

async function onDraw() {
  drawing.value = true
  try {
    await drawGroup({ groupId: groupId.value, adminToken: adminToken.value })
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
        <h2 class="flex items-center gap-2 font-display text-xl"><Link2 class="size-5" aria-hidden="true" />Endereço do grupo</h2>
        <p class="text-sm text-muted-foreground">Opcional. Troque o código do link por um nome fácil, como <span class="font-medium">familia-da-bagunca</span>.</p>
        <div class="flex gap-2">
          <Input v-model="slugDraft" class="h-11" maxlength="40" autocomplete="off" placeholder="familia-da-bagunca" aria-label="Endereço do grupo" />
          <Button type="submit" class="h-11 shrink-0" :disabled="savingSlug || slugDraft.trim().length < 3">Salvar</Button>
        </div>
        <div v-if="slugSuggestions.length > 0" class="flex flex-wrap items-center gap-2 text-sm">
          <span class="text-muted-foreground">Sugestões:</span>
          <Button v-for="item in slugSuggestions" :key="item" type="button" size="sm" variant="outline" @click="slugDraft = item">{{ item }}</Button>
        </div>
      </form>

      <div class="space-y-2 rounded-lg border border-warning/50 bg-warning/10 p-4">
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
