<script setup lang="ts">
import { getLocalTimeZone, today, type DateValue } from '@internationalized/date'
import { ArrowLeft, CalendarIcon, ChevronRight, Gift, KeyRound, ListChecks, Lock, LogOut } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import FactList from '@/components/FactList.vue'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import PinField from '@/components/PinField.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import CardSkeleton from '@/components/skeletons/CardSkeleton.vue'
import HeaderSkeleton from '@/components/skeletons/HeaderSkeleton.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { loadUser, logout, useAuth } from '@/core/services/auth'
import AuthForm from './components/AuthForm.vue'
import { dateValueToIso, eventYearRange, formatDateValue, isoToDateValue } from '@/lib/date'
import { parseMoney } from '@/lib/money'
import { makeRoomBelow } from '@/lib/scroll'
import { cn } from '@/lib/utils'
import WishlistEditor from './components/WishlistEditor.vue'
import { createGroup, listMyGroups, SantaApiError, type MyGroup, type WishItem } from './lib/api'
import { adminPath } from './lib/links'
import { CREATE_STEP_TITLES, LIMITS, PIN_LENGTH } from './constants'
import { isPin } from './lib/pin'
import { saveCredentials } from './lib/session'

const router = useRouter()
/** A data da troca não pode estar no passado. */
const minDate = today(getLocalTimeZone())
const { user, ready } = useAuth()

const step = ref(1)
const name = ref('')
const budget = ref('')
const eventDate = ref('')
const eventDateOpen = ref(false)
const eventYears = computed(() => eventYearRange(eventDateValue.value))
/** O Calendar usa `DateValue`; o grupo guarda a data como texto AAAA-MM-DD. */
const eventDateValue = computed<DateValue | undefined>({
  get: () => isoToDateValue(eventDate.value),
  set: (value) => {
    eventDate.value = dateValueToIso(value)
    eventDateOpen.value = false
  },
})
const participates = ref(true)
const myName = ref('')
const myPin = ref('')
const myWishlist = ref<WishItem[]>([])
const myGroups = ref<MyGroup[]>([])
const loading = ref(false)
const error = ref('')

// Grupos da conta: quem organiza mais de um amigo secreto escolhe qual abrir.
async function loadMyGroups() {
  try {
    myGroups.value = (await listMyGroups()).groups
  } catch {
    // Sem rede: só não mostra a lista.
  }
}

// Reage à mudança de "conectado" em vez de depender do aviso do formulário de login: ao entrar, o
// formulário some da tela antes de conseguir avisar, e a lista só aparecia depois de recarregar.
watch(
  user,
  (current) => {
    if (!current) return
    // O nome da conta já vem preenchido como o nome de quem participa (dá para trocar).
    if (!myName.value) myName.value = current.name
    void loadMyGroups()
  },
  { immediate: true },
)

onMounted(loadUser)

async function onLogout() {
  await logout()
  myGroups.value = []
  step.value = 1
}

const stepTitles = CREATE_STEP_TITLES
const lastStep = stepTitles.length
const canContinue = computed(() => {
  if (step.value === 1) return name.value.trim().length > 0
  if (step.value === lastStep && participates.value) return myName.value.trim().length > 0 && isPin(myPin.value)
  return true
})

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const { groupId } = await createGroup({
      name: name.value,
      budget: parseMoney(budget.value),
      eventDate: eventDate.value,
      ...(participates.value
        ? { organizer: { name: myName.value, pin: myPin.value, wishlist: myWishlist.value } }
        : {}),
    })
    if (participates.value) saveCredentials(groupId, { name: myName.value, pin: myPin.value })
    await router.push(adminPath(groupId))
  } catch (e) {
    error.value = e instanceof SantaApiError ? e.message : 'Não foi possível criar o grupo.'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

function onNext() {
  if (step.value < lastStep) step.value += 1
  else onSubmit()
}
</script>

<template>
  <section class="mx-auto w-full max-w-xl space-y-8">
    <PageHeader filled :icon="Gift" title="Amigo secreto" description="Crie o grupo, cadastre as pessoas e sorteie. Cada uma vê só quem tirou.">
      <template v-if="user" #actions>
        <Button variant="ghost" size="sm" @click="onLogout">
          <LogOut aria-hidden="true" />
          Sair
        </Button>
      </template>
      <FactList>
        <FactTile :icon="ListChecks" label="Grupo">{{ stepTitles.length }} passos</FactTile>
        <FactTile :icon="KeyRound" label="PIN">{{ PIN_LENGTH }} números</FactTile>
        <FactTile :icon="Lock" label="Privacidade" tone="paper">Só você vê</FactTile>
      </FactList>
      <p v-if="user" class="truncate text-sm text-primary-foreground/90">Conectado como {{ user.email }}</p>
    </PageHeader>

    <div v-if="!ready" class="space-y-6" role="status" aria-label="Carregando">
      <Skeleton class="h-6 w-44" />
      <Skeleton class="h-[76px] w-full rounded-xl" />
      <CardSkeleton :lines="0" :rows="2" button />
    </div>

    <Card v-else-if="!user">
      <CardContent><AuthForm /></CardContent>
    </Card>

    <template v-else>
      <div v-if="myGroups.length > 0" class="space-y-3">
        <h2 class="text-lg">Seus amigos secretos</h2>
        <ItemGroup class="gap-2">
          <Item v-for="group in myGroups" :key="group.id" as-child variant="outline" class="bg-card hover:bg-accent">
            <RouterLink :to="adminPath(group.id)">
              <ItemContent>
                <ItemTitle>{{ group.name }}</ItemTitle>
                <ItemDescription>Abrir painel do organizador</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge :variant="group.status === 'drawn' ? 'success' : 'tool'" class="rounded-md">
                  {{ group.status === 'drawn' ? 'Sorteado' : 'Aberto' }}
                </Badge>
                <ChevronRight class="size-4 text-muted-foreground" aria-hidden="true" />
              </ItemActions>
            </RouterLink>
          </Item>
        </ItemGroup>
        <p class="text-sm text-muted-foreground">Ou crie um novo grupo abaixo.</p>
      </div>

      <Card>
        <CardContent>
          <form class="space-y-6" @submit.prevent="onNext">
            <div class="space-y-3">
              <Progress :model-value="(step / lastStep) * 100" :aria-label="`Passo ${step} de ${lastStep}`" class="h-1.5" />
              <p class="text-sm font-medium text-muted-foreground">Passo {{ step }} de {{ lastStep }}</p>
              <h2 class="text-xl">{{ stepTitles[step - 1] }}</h2>
            </div>

            <FieldGroup v-if="step === 1">
              <Field>
                <FieldLabel for="group-name">Nome do grupo</FieldLabel>
                <Input id="group-name" v-model="name" :maxlength="LIMITS.groupName" autocomplete="off" placeholder="Família Silva" />
              </Field>
            </FieldGroup>

            <FieldGroup v-else-if="step === 2">
              <Field>
                <FieldLabel for="budget">Valor sugerido</FieldLabel>
                <Input id="budget" v-model="budget" v-money :maxlength="LIMITS.budgetInput" placeholder="R$ 50,00" inputmode="numeric" />
              </Field>
              <Field>
                <FieldLabel for="event-date">Data da troca</FieldLabel>
                <Popover v-model:open="eventDateOpen">
                  <PopoverTrigger as-child>
                    <Button id="event-date" type="button" variant="outline" @click.capture="makeRoomBelow" :class="cn('w-full justify-start text-left font-normal', !eventDateValue && 'text-muted-foreground')">
                      <CalendarIcon aria-hidden="true" />
                      {{ eventDateValue ? formatDateValue(eventDateValue) : 'Escolha a data' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-(--reka-popover-trigger-width) max-w-[22rem] p-0">
                    <Calendar v-model="eventDateValue" :default-placeholder="eventDateValue ?? minDate" :min-value="minDate" :year-range="eventYears" locale="pt-BR" weekday-format="short" layout="month-and-year" initial-focus />
                    <div class="border-t p-1">
                      <Button type="button" variant="ghost" size="sm" class="w-full" @click="eventDateValue = minDate">Hoje</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </Field>
            </FieldGroup>

            <FieldGroup v-else>
              <Field orientation="horizontal">
                <Switch id="participates" v-model="participates" />
                <FieldLabel for="participates">Quero entrar no sorteio</FieldLabel>
              </Field>
              <template v-if="participates">
                <Field>
                  <FieldLabel for="my-name">Seu nome</FieldLabel>
                  <Input id="my-name" v-model="myName" :maxlength="LIMITS.personName" autocomplete="off" data-1p-ignore data-lpignore="true" />
                </Field>
                <Field>
                  <FieldLabel for="my-pin">PIN de {{ PIN_LENGTH }} números</FieldLabel>
                  <PinField id="my-pin" v-model="myPin" :length="PIN_LENGTH" label="PIN" />
                  <FieldDescription>Você usa o PIN para ver quem tirou. Anote, não dá para recuperar.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>O que você gostaria de ganhar</FieldLabel>
                  <WishlistEditor v-model="myWishlist" />
                </Field>
              </template>
              <p v-else class="text-sm text-muted-foreground">
                Você organiza o grupo e não entra no sorteio. Mesmo participando, você não vê os pares dos outros.
              </p>
            </FieldGroup>

            <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>

            <div class="flex items-center gap-3">
              <Button v-if="step > 1" type="button" variant="outline" size="lg" @click="step -= 1">
                <ArrowLeft aria-hidden="true" />
                Voltar
              </Button>
              <Button type="submit" size="lg" class="flex-1" :disabled="!canContinue || loading">
                <Spinner v-if="loading" />
                {{ step < lastStep ? 'Continuar' : loading ? 'Criando...' : 'Criar grupo' }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </template>
  </section>
</template>
