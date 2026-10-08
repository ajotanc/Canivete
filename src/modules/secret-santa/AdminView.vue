<script setup lang="ts">
import { getLocalTimeZone, today, type DateValue } from '@internationalized/date'
import { ArrowLeft, CalendarDays, CalendarIcon, Check, Clock, Copy, Dices, EllipsisVertical, Gift, KeyRound, Link2, Lock, LogOut, Palette, Pencil, RotateCcw, RefreshCw, SearchX, Trash2, TriangleAlert, UserPlus, Users } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import { applyGroupColor, COLOR_LABELS, colorLabel, colorProblem, isHexColor } from './lib/groupColor'
import ConfirmDelete from '@/components/ConfirmDelete.vue'
import BoardPanel from './components/BoardPanel.vue'
import ExclusionsCard from './components/ExclusionsCard.vue'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { loadUser, logout, useAuth } from '@/core/services/auth'
import AuthForm from './components/AuthForm.vue'
import { useRefreshOnFocus } from './composables/useRefreshOnFocus'
import {
  addParticipant,
  deleteGroup,
  drawGroup,
  getGroup,
  listParticipants,
  removeParticipant,
  renameParticipant,
  resetDraw,
  resetPin,
  SantaApiError,
  setColor,
  setSlug,
  updateGroup,
  type ParticipantSummary,
} from './lib/api'
import { dateValueToIso, eventYearRange, formatDateValue, isoToDateValue } from '@/lib/date'
import { formatMoney, parseMoney } from '@/lib/money'
import { makeRoomBelow } from '@/lib/scroll'
import { cn } from '@/lib/utils'
import { GROUP_COLORS, LIMITS, MIN_PARTICIPANTS_TO_DRAW } from './constants'
import { eventCountdown, formatEventDate } from './lib/event'
import { slugifyInput, trimSlug } from './lib/slug'
import { inviteUrl, mePath, whatsappDrawnUrl, whatsappPendingUrl, whatsappReminderUrl, whatsappUrl } from './lib/links'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
/** Id ou endereço amigável, como veio da URL. */
const groupId = ref(String(route.params.id))

type State = 'loading' | 'ready' | 'login' | 'forbidden' | 'not-found' | 'error'
const state = ref<State>('loading')
const errorMessage = ref('')
const status = ref<'open' | 'drawing' | 'drawn'>('open')
const anyRevealed = ref(false)
const resetDrawOpen = ref(false)
const resettingDraw = ref(false)
const color = ref('berry')
const customColor = ref('#0f766e')
const savingColor = ref(false)
const participants = ref<ParticipantSummary[]>([])
const exclusions = ref<[string, string][]>([])
const groupName = ref('')
const budget = ref<number | null>(null)
const slug = ref<string | null>(null)
const slugDraft = ref('')
const eventDate = ref('')
/** Campos do formulário "Dados do grupo"; só são preenchidos na primeira carga para não apagar o que a pessoa digita. */
const editName = ref('')
const editBudget = ref('')
const editDate = ref('')
const editDateOpen = ref(false)
const editYears = computed(() => eventYearRange(editDateValue.value))
/** O Calendar usa `DateValue`; o grupo guarda a data como texto AAAA-MM-DD. */
const editDateValue = computed<DateValue | undefined>({
  get: () => isoToDateValue(editDate.value),
  set: (value) => {
    editDate.value = dateValueToIso(value)
    editDateOpen.value = false
  },
})
let editLoaded = false
const savingGroup = ref(false)
const renameTarget = ref<string | null>(null)
const renameDraft = ref('')
const renaming = ref(false)
const savingSlug = ref(false)
const confirmOpen = ref(false)
const drawing = ref(false)
const newName = ref('')
const adding = ref(false)
const newNameInput = ref<InstanceType<typeof InputGroupInput> | null>(null)
/** Pessoa cujo PIN o organizador quer zerar (abre a confirmação). */
const resetTarget = ref<string | null>(null)
const resetting = ref(false)
const removeTarget = ref<string | null>(null)
const removing = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)

const origin = window.location.origin
const invite = computed(() => inviteUrl(window.location.origin, groupId.value, slug.value))
const hasMyself = computed(() => participants.value.some((p) => p.isOrganizer))
const myName = computed(() => participants.value.find((p) => p.isOrganizer)?.name ?? '')
const canDraw = computed(() => status.value === 'open' && participants.value.length >= MIN_PARTICIPANTS_TO_DRAW)
const pending = computed(() => participants.value.filter((p) => !p.hasPin))
const pendingCount = computed(() => pending.value.length)
const revealedCount = computed(() => participants.value.filter((p) => p.revealed).length)
/** Antes do sorteio acompanha os PINs; depois dele, quem já abriu a carta. */
/** Uma Function antiga não manda `revealed`: nesse caso não dá para afirmar quem abriu a carta. */
const knowsReveals = computed(() => participants.value.every((p) => typeof p.revealed === 'boolean'))
const progress = computed(() =>
  status.value === 'drawn' && knowsReveals.value
    ? { done: revealedCount.value, label: 'já abriram a carta' }
    : { done: participants.value.length - pendingCount.value, label: 'já criaram o PIN' },
)

/** Linha de situação de cada pessoa na lista. */
function personState(person: ParticipantSummary) {
  if (!person.hasPin) return { icon: Clock, text: 'Ainda não acessou', ok: false }
  if (status.value !== 'drawn' || !knowsReveals.value) return { icon: Check, text: 'PIN criado', ok: true }
  return person.revealed
    ? { icon: Check, text: 'Já viu quem tirou', ok: true }
    : { icon: Clock, text: 'Ainda não abriu a carta', ok: false }
}

/** `silent`: atualização em segundo plano (ao voltar para a aba); se falhar, mantém a tela como está. */
async function refresh(silent = false) {
  try {
    const [result, group] = await Promise.all([
      listParticipants({ groupId: groupId.value }),
      getGroup(groupId.value),
    ])
    groupId.value = group.id
    color.value = group.color
    if (isHexColor(group.color)) customColor.value = group.color
    applyGroupColor(group.color)
    groupName.value = group.name
    eventDate.value = group.eventDate
    budget.value = group.budget
    if (!editLoaded) {
      editName.value = group.name
      editBudget.value = formatMoney(group.budget)
      editDate.value = group.eventDate
      editLoaded = true
    }
    slug.value = group.slug
    // O texto do link já vem sugerido a partir do nome do grupo; o organizador só confirma ou troca.
    slugDraft.value ||= group.slug ?? trimSlug(slugifyInput(group.name))
    status.value = result.status
    participants.value = result.participants
    exclusions.value = result.exclusions ?? []
    anyRevealed.value = result.anyRevealed
    state.value = 'ready'
  } catch (e) {
    if (silent) return
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

// Quem abriu o painel numa aba antiga vê a situação de PINs e cartas atualizada ao voltar.
useRefreshOnFocus(() => (state.value === 'ready' ? refresh(true) : undefined))

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

function startRename(name: string) {
  renameTarget.value = name
  renameDraft.value = name
}

async function onRename() {
  const from = renameTarget.value
  const to = renameDraft.value.trim()
  if (!from || !to) return
  if (to === from) {
    renameTarget.value = null
    return
  }
  renaming.value = true
  try {
    const result = await renameParticipant({ groupId: groupId.value, name: from, newName: to })
    toast.success(`${from} agora é ${result.name}.`)
    renameTarget.value = null
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível trocar o nome.')
  } finally {
    renaming.value = false
  }
}

const groupDataChanged = computed(
  () =>
    editName.value.trim() !== groupName.value ||
    parseMoney(editBudget.value) !== budget.value ||
    editDate.value !== eventDate.value,
)

async function onSaveGroup() {
  savingGroup.value = true
  try {
    const saved = await updateGroup({
      groupId: groupId.value,
      name: editName.value,
      budget: parseMoney(editBudget.value),
      eventDate: editDate.value,
    })
    groupName.value = saved.name
    budget.value = saved.budget
    eventDate.value = saved.eventDate
    editName.value = saved.name
    editBudget.value = formatMoney(saved.budget)
    editDate.value = saved.eventDate
    toast.success('Dados do grupo salvos.')
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível salvar os dados do grupo.')
  } finally {
    savingGroup.value = false
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

async function onColor(next: string) {
  if (next === color.value || savingColor.value) return
  if (isHexColor(next)) {
    const problem = colorProblem(next)
    if (problem) {
      toast.error(problem)
      return
    }
    customColor.value = next
  }
  const previous = color.value
  color.value = next
  applyGroupColor(next)
  savingColor.value = true
  try {
    await setColor({ groupId: groupId.value, color: next })
    toast.success(`Cor do grupo: ${colorLabel(next)}.`)
  } catch (e) {
    color.value = previous
    applyGroupColor(previous)
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível salvar a cor.')
  } finally {
    savingColor.value = false
  }
}

async function onRemove(name: string) {
  removing.value = true
  try {
    await removeParticipant({ groupId: groupId.value, name })
    toast.success(`${name} saiu do grupo.`)
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível remover.')
  } finally {
    removing.value = false
    removeTarget.value = null
  }
}

async function onResetDraw() {
  resettingDraw.value = true
  try {
    await resetDraw({ groupId: groupId.value })
    toast.success('Sorteio desfeito. O grupo está aberto de novo.')
    resetDrawOpen.value = false
    await refresh()
  } catch (e) {
    toast.error(e instanceof SantaApiError ? e.message : 'Não foi possível refazer o sorteio.')
    resetDrawOpen.value = false
    await refresh()
  } finally {
    resettingDraw.value = false
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
  <section class="mx-auto w-full max-w-5xl space-y-8">
    <div v-if="state === 'loading'" class="space-y-4" role="status" aria-label="Abrindo o painel">
      <Skeleton class="h-9 w-1/2" />
      <Skeleton class="h-5 w-2/3" />
      <Skeleton class="h-64 w-full" />
    </div>

    <Card v-else-if="state === 'login'" class="mx-auto w-full max-w-xl">
      <CardContent><AuthForm @done="onLoggedIn" /></CardContent>
    </Card>

    <Empty v-else-if="state === 'forbidden'" class="rounded-xl border border-dashed bg-card/50 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon"><Lock aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Este grupo é de outra conta</EmptyTitle>
        <EmptyDescription>
          Só quem criou o grupo administra. Você está como {{ user?.email }}. Entre com a conta certa para abrir o painel.
        </EmptyDescription>
      </EmptyHeader>
      <div class="flex flex-wrap justify-center gap-3">
        <Button size="lg" @click="onLogout">Trocar de conta</Button>
        <Button as-child size="lg" variant="outline"><RouterLink :to="`/secret-santa/g/${groupId}`">Ir para o convite</RouterLink></Button>
      </div>
    </Empty>

    <Empty v-else-if="state === 'not-found'" class="rounded-xl border border-dashed bg-card/50 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon"><SearchX aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Grupo não encontrado</EmptyTitle>
        <EmptyDescription>Ele pode ter sido excluído ou o link está incompleto.</EmptyDescription>
      </EmptyHeader>
      <Button as-child size="lg"><RouterLink to="/secret-santa">Criar um grupo</RouterLink></Button>
    </Empty>

    <Empty v-else-if="state === 'error'" class="rounded-xl border border-dashed bg-card/50 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon"><TriangleAlert aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>Não foi possível abrir o painel</EmptyTitle>
        <EmptyDescription>{{ errorMessage }}</EmptyDescription>
      </EmptyHeader>
      <Button size="lg" @click="refresh()">Tentar de novo</Button>
    </Empty>

    <template v-else>
      <PageHeader
        filled
        :icon="Gift"
        :title="groupName"
        :description="
          status === 'drawn'
            ? 'O sorteio foi feito. Quem ainda não acessou pode criar o PIN e ver quem tirou.'
            : 'Adicione as pessoas e mande o link do grupo. Cada uma escolhe o próprio nome e cria o PIN.'
        "
      >
        <template #back>
          <Button as-child variant="ghost" size="sm">
            <RouterLink to="/secret-santa"><ArrowLeft aria-hidden="true" />Meus grupos</RouterLink>
          </Button>
        </template>
        <template #actions>
          <Button variant="ghost" size="sm" @click="onLogout">
            <LogOut aria-hidden="true" />
            Sair
          </Button>
        </template>
        <template #badge>
          <Badge variant="glass" class="rounded-md">{{ status === 'drawn' ? 'Sorteado' : 'Aberto' }}</Badge>
        </template>
        <FactList>
          <FactTile :icon="Users" label="Participantes">{{ participants.length }} {{ participants.length === 1 ? 'pessoa' : 'pessoas' }}</FactTile>
          <FactTile :icon="KeyRound" label="PIN criado">{{ participants.length - pendingCount }} de {{ participants.length }}</FactTile>
          <FactTile v-if="eventDate" :icon="CalendarDays" :label="eventCountdown(eventDate)" tone="paper">{{ formatEventDate(eventDate) }}</FactTile>
          <FactTile v-else :icon="Gift" label="Sorteio" tone="paper">{{ status === 'drawn' ? 'Já foi feito' : 'Ainda não foi feito' }}</FactTile>
        </FactList>
      </PageHeader>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)]">
        <!-- Pessoas -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Pessoas ({{ participants.length }})</CardTitle>
            <CardDescription v-if="participants.length > 0">
              {{ progress.done }} de {{ participants.length }} {{ progress.label }}.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-5">
            <Progress v-if="participants.length > 0" :model-value="(progress.done / participants.length) * 100" :aria-label="`Pessoas que ${progress.label}`" class="h-1.5" />
            <Button v-if="pendingCount > 1" as-child variant="outline" size="sm" class="w-full sm:w-auto">
              <a :href="whatsappPendingUrl(groupName, pending.map((p) => p.name), invite)" target="_blank" rel="noopener noreferrer">
                <WhatsappIcon class="size-4 text-[#25D366]" />
                Lembrar as {{ pendingCount }} pessoas sem PIN
              </a>
            </Button>

            <form v-if="status === 'open'" @submit.prevent="onAdd">
              <InputGroup class="h-11 bg-card">
                <InputGroupInput
                  ref="newNameInput"
                  v-model="newName"
                  :maxlength="LIMITS.personName"
                  autocomplete="off"
                  placeholder="Nome da pessoa"
                  aria-label="Nome da pessoa"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton type="submit" variant="default" size="sm" :disabled="adding || !newName.trim()">
                    <Spinner v-if="adding" />
                    <UserPlus v-else aria-hidden="true" />
                    Adicionar
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>

            <Empty v-if="participants.length === 0" class="rounded-lg border border-dashed p-8">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Users aria-hidden="true" /></EmptyMedia>
                <EmptyTitle>Ninguém foi adicionado ainda</EmptyTitle>
                <EmptyDescription>Digite o nome da primeira pessoa acima. São necessárias pelo menos {{ MIN_PARTICIPANTS_TO_DRAW }} para sortear.</EmptyDescription>
              </EmptyHeader>
            </Empty>
            <ItemGroup v-else class="gap-2">
              <Item v-for="person in participants" :key="person.name" variant="muted" size="sm">
                <ItemContent>
                  <ItemTitle>
                    {{ person.name }}
                    <Badge v-if="person.isOrganizer" variant="outline" class="rounded-md font-normal">você</Badge>
                  </ItemTitle>
                  <ItemDescription class="flex items-center gap-1.5" :class="personState(person).ok ? 'text-success' : 'text-warning'">
                    <component :is="personState(person).icon" class="size-3.5" aria-hidden="true" />
                    {{ personState(person).text }}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" :aria-label="`Ações de ${person.name}`">
                        <EllipsisVertical class="size-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="min-w-48">
                      <DropdownMenuItem @select="startRename(person.name)">
                        <Pencil aria-hidden="true" />
                        Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="!person.hasPin" as-child>
                        <a :href="whatsappReminderUrl(groupName, person.name, invite)" target="_blank" rel="noopener noreferrer">
                          <WhatsappIcon class="size-4 text-[#25D366]" />
                          Lembrar pelo WhatsApp
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem v-if="person.hasPin" @select="resetTarget = person.name">
                        <KeyRound aria-hidden="true" />
                        Zerar PIN
                      </DropdownMenuItem>
                      <template v-if="status === 'open'">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" @select="removeTarget = person.name">
                          <Trash2 aria-hidden="true" />
                          Remover
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ItemActions>
              </Item>
            </ItemGroup>

            <Button variant="ghost" size="sm" @click="refresh()">
              <RefreshCw aria-hidden="true" />
              Atualizar lista
            </Button>
          </CardContent>
        </Card>

        <div class="space-y-6">
          <!-- Convite -->
          <Card>
            <CardHeader><CardTitle class="text-lg">Convite</CardTitle></CardHeader>
            <CardContent class="space-y-4">
              <InputGroup class="h-11 bg-card">
                <InputGroupInput :model-value="invite" readonly aria-label="Link do convite" />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="sm" aria-label="Copiar convite" @click="copy(invite, 'Convite')">
                    <Copy aria-hidden="true" />
                    Copiar
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <Button as-child size="lg" class="w-full bg-success text-white hover:bg-success/90">
                <a :href="whatsappUrl(groupName, invite)" target="_blank" rel="noopener noreferrer">
                  <WhatsappIcon class="size-4" />
                  Enviar pelo WhatsApp
                </a>
              </Button>
              <Separator />
              <form @submit.prevent="onSaveSlug">
                <Field>
                  <FieldLabel for="slug">Texto do link</FieldLabel>
                  <InputGroup class="h-11 bg-card">
                    <InputGroupAddon><Link2 aria-hidden="true" /></InputGroupAddon>
                    <InputGroupInput
                      id="slug"
                      :model-value="slugDraft"
                      :maxlength="LIMITS.slugMax"
                      autocomplete="off"
                      placeholder="familia-da-bagunca"
                      @input="onSlugInput"
                      @blur="slugDraft = trimSlug(slugDraft)"
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton type="submit" variant="default" size="sm" :disabled="savingSlug || slugDraft.trim().length < LIMITS.slugMin">Salvar</InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription class="break-all">{{ inviteUrl(origin, groupId, slugDraft ? trimSlug(slugDraft) : null) }}</FieldDescription>
                </Field>
              </form>
            </CardContent>
          </Card>

          <!-- Sorteio -->
          <Card v-if="status === 'open'">
            <CardHeader>
              <CardTitle class="text-lg">Sorteio</CardTitle>
              <CardDescription>Depois de sortear não dá para mudar as pessoas.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <Button size="lg" class="w-full" :disabled="!canDraw" @click="confirmOpen = true">
                <Dices aria-hidden="true" />
                Sortear
              </Button>
              <p v-if="!canDraw" class="text-sm text-muted-foreground">São necessárias pelo menos {{ MIN_PARTICIPANTS_TO_DRAW }} pessoas para sortear.</p>
              <p v-else-if="pendingCount > 0" class="text-sm text-muted-foreground">
                {{ pendingCount === 1 ? '1 pessoa ainda não criou' : `${pendingCount} pessoas ainda não criaram` }} o PIN. Dá para
                sortear assim mesmo: quem não criou cria depois e vê quem tirou.
              </p>
            </CardContent>
          </Card>

          <Card v-else>
            <CardHeader>
              <CardTitle class="text-lg">O sorteio foi feito</CardTitle>
              <CardDescription>Avise o grupo para cada pessoa abrir a sua carta.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <Button as-child size="lg" class="w-full bg-success text-white hover:bg-success/90">
                <a :href="whatsappDrawnUrl(groupName, invite)" target="_blank" rel="noopener noreferrer">
                  <WhatsappIcon class="size-4" />
                  Avisar o grupo pelo WhatsApp
                </a>
              </Button>
              <Button v-if="hasMyself" as-child variant="outline" size="lg" class="w-full">
                <RouterLink :to="{ path: mePath(String(route.params.id)), query: { person: myName } }">
                  <Gift aria-hidden="true" />
                  Ver meu amigo
                </RouterLink>
              </Button>
            </CardContent>
          </Card>

          <!-- Refazer o sorteio -->
          <Card v-if="status === 'drawn'">
            <CardHeader>
              <CardTitle class="text-lg">Refazer o sorteio</CardTitle>
              <CardDescription>
                {{ anyRevealed ? 'Alguém já abriu a carta e viu quem tirou. Agora não dá mais para refazer.' : 'Enquanto ninguém abrir a carta, dá para desfazer o sorteio e sortear de novo.' }}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="lg" class="w-full" :disabled="anyRevealed" @click="resetDrawOpen = true">
                <RotateCcw aria-hidden="true" />
                Refazer o sorteio
              </Button>
            </CardContent>
          </Card>

          <!-- Minha lista de presentes -->
          <Card v-if="hasMyself && status === 'open'">
            <CardHeader>
              <CardTitle class="text-lg">Minha lista de presentes</CardTitle>
              <CardDescription>Escreva o que você gostaria de ganhar e, se tiver, o link do produto.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button as-child variant="outline" size="lg" class="w-full">
                <RouterLink :to="{ path: mePath(String(route.params.id)), query: { person: myName } }">
                  <Gift aria-hidden="true" />
                  Editar minha lista
                </RouterLink>
              </Button>
            </CardContent>
          </Card>

          <ExclusionsCard
            v-if="status === 'open' && participants.length >= MIN_PARTICIPANTS_TO_DRAW"
            :group-id="groupId"
            :names="participants.map((p) => p.name)"
            :exclusions="exclusions"
            @changed="refresh()"
          />

          <!-- Mural -->
          <BoardPanel :credentials="{ groupId }" />

          <!-- Dados do grupo -->
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Dados do grupo</CardTitle>
              <CardDescription>Dá para corrigir o nome, o valor e a data da troca a qualquer momento.</CardDescription>
            </CardHeader>
            <CardContent>
              <form @submit.prevent="onSaveGroup">
                <FieldGroup>
                  <Field>
                    <FieldLabel for="edit-name">Nome do grupo</FieldLabel>
                    <Input id="edit-name" v-model="editName" :maxlength="LIMITS.groupName" autocomplete="off" />
                  </Field>
                  <Field>
                    <FieldLabel for="edit-budget">Valor sugerido</FieldLabel>
                    <Input id="edit-budget" v-model="editBudget" v-money :maxlength="LIMITS.budgetInput" placeholder="R$ 50,00" inputmode="numeric" />
                  </Field>
                  <Field>
                    <FieldLabel for="edit-date">Data da troca</FieldLabel>
                    <Popover v-model:open="editDateOpen">
                      <PopoverTrigger as-child>
                        <Button id="edit-date" type="button" variant="outline" @click.capture="makeRoomBelow" :class="cn('w-full justify-start text-left font-normal', !editDateValue && 'text-muted-foreground')">
                          <CalendarIcon aria-hidden="true" />
                          {{ editDateValue ? formatDateValue(editDateValue) : 'Escolha a data' }}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-(--reka-popover-trigger-width) max-w-[22rem] p-0">
                        <Calendar v-model="editDateValue" :default-placeholder="editDateValue" :year-range="editYears" locale="pt-BR" weekday-format="short" layout="month-and-year" initial-focus />
                        <div class="border-t p-1">
                          <Button type="button" variant="ghost" size="sm" class="w-full" @click="editDateValue = today(getLocalTimeZone())">Hoje</Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </Field>
                  <Button type="submit" size="lg" class="w-full" :disabled="savingGroup || !editName.trim() || !groupDataChanged">
                    <Spinner v-if="savingGroup" />
                    {{ savingGroup ? 'Salvando...' : 'Salvar dados' }}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <!-- Cor do grupo -->
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Cor do grupo</CardTitle>
              <CardDescription>Todo mundo que abrir o link vê o grupo nessa cor. Sem escolha, fica framboesa.</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex flex-wrap gap-3" role="radiogroup" aria-label="Cor do grupo">
                <button
                  v-for="option in GROUP_COLORS"
                  :key="option"
                  type="button"
                  role="radio"
                  :aria-checked="color === option"
                  :aria-label="COLOR_LABELS[option]"
                  :data-tool="option"
                  :disabled="savingColor"
                  class="flex size-9 items-center justify-center rounded-full bg-tool text-tool-foreground outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/60 enabled:hover:scale-105 motion-reduce:transition-none"
                  :class="color === option ? 'ring-3 ring-foreground ring-offset-2 ring-offset-card' : ''"
                  @click="onColor(option)"
                >
                  <Check v-if="color === option" class="size-4" aria-hidden="true" />
                </button>
                <label
                  class="relative flex size-9 cursor-pointer items-center justify-center rounded-full text-white outline-none transition-transform focus-within:ring-3 focus-within:ring-ring/60 hover:scale-105 motion-reduce:transition-none"
                  :class="isHexColor(color) ? 'ring-3 ring-foreground ring-offset-2 ring-offset-card' : ''"
                  :style="{ background: isHexColor(color) ? color : 'conic-gradient(var(--berry), var(--amber), var(--pine), var(--cobalt), var(--violet), var(--berry))' }"
                  title="Escolher outra cor"
                >
                  <Check v-if="isHexColor(color)" class="size-4" aria-hidden="true" />
                  <Palette v-else class="size-4 drop-shadow" aria-hidden="true" />
                  <input
                    type="color"
                    class="absolute inset-0 size-full cursor-pointer opacity-0"
                    :value="customColor"
                    :disabled="savingColor"
                    aria-label="Escolher outra cor"
                    @change="onColor(($event.target as HTMLInputElement).value)"
                  />
                </label>
              </div>
              <p class="mt-3 text-sm text-muted-foreground">{{ colorLabel(color) }}</p>
            </CardContent>
          </Card>

          <!-- Excluir -->
          <Card class="border-destructive/40">
            <CardHeader>
              <CardTitle class="text-lg text-destructive">Excluir grupo</CardTitle>
              <CardDescription>Apaga o grupo, as pessoas, as perguntas e o mural. Não dá para desfazer.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" @click="deleteOpen = true">
                <Trash2 aria-hidden="true" />
                Excluir grupo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog :open="renameTarget !== null" @update:open="(open: boolean) => !open && (renameTarget = null)">
        <DialogContent>
          <form class="space-y-4" @submit.prevent="onRename">
            <DialogHeader>
              <DialogTitle>Renomear {{ renameTarget }}</DialogTitle>
              <DialogDescription>
                O PIN, o par do sorteio e as regras de exclusão continuam valendo.
                {{ status === 'drawn' ? 'Quem já abriu a tela entra de novo escolhendo o nome novo.' : '' }}
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel for="rename-input">Novo nome</FieldLabel>
              <Input id="rename-input" v-model="renameDraft" :maxlength="LIMITS.personName" autocomplete="off" />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" @click="renameTarget = null">Cancelar</Button>
              <Button type="submit" :disabled="renaming || !renameDraft.trim()">
                <Spinner v-if="renaming" />
                {{ renaming ? 'Salvando...' : 'Salvar nome' }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        v-model:open="resetDrawOpen"
        title="Desfazer o sorteio?"
        description="Os pares somem, as perguntas anônimas são apagadas e o grupo volta a ficar aberto. Depois é só sortear de novo."
        confirm-label="Desfazer sorteio"
        :busy="resettingDraw"
        @confirm="onResetDraw"
      />

      <ConfirmDelete
        :open="removeTarget !== null"
        :title="`Remover ${removeTarget} do grupo?`"
        description="A pessoa sai da lista, perde o PIN e as regras de sorteio dela. Dá para adicionar de novo depois."
        confirm-label="Remover"
        :busy="removing"
        @update:open="(open: boolean) => !open && (removeTarget = null)"
        @confirm="removeTarget && onRemove(removeTarget)"
      />

      <AlertDialog v-model:open="deleteOpen">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{{ groupName }}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as pessoas cadastradas, o sorteio, as perguntas anônimas e os recados do mural serão apagados para sempre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" :disabled="deleting" @click="onDeleteGroup">
              <Spinner v-if="deleting" />
              {{ deleting ? 'Excluindo...' : 'Excluir tudo' }}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog v-model:open="confirmOpen">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sortear agora?</AlertDialogTitle>
            <AlertDialogDescription>
              Depois do sorteio não dá para adicionar nem remover pessoas. Se ninguém tiver aberto a carta ainda, dá para desfazer e sortear de novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button :disabled="drawing" @click="onDraw">
              <Spinner v-if="drawing" />
              {{ drawing ? 'Sorteando...' : 'Sortear' }}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog :open="resetTarget !== null" @update:open="(open: boolean) => !open && (resetTarget = null)">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zerar o PIN de {{ resetTarget }}?</AlertDialogTitle>
            <AlertDialogDescription>
              A pessoa vai criar um PIN novo no próximo acesso. O par do sorteio não muda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button :disabled="resetting" @click="onReset">
              <Spinner v-if="resetting" />
              {{ resetting ? 'Zerando...' : 'Zerar PIN' }}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </template>
  </section>
</template>
