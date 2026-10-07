<script setup lang="ts">
import { ArrowLeft, ChevronRight, Gift, KeyRound, ListChecks, Lock, LogOut } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import FactTile from '@/components/FactTile.vue'
import PageHeader from '@/components/PageHeader.vue'
import PinField from '@/components/PinField.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { loadUser, logout, useAuth } from '@/core/services/auth'
import AuthForm from './components/AuthForm.vue'
import { parseMoney } from '@/lib/money'
import WishlistEditor from './components/WishlistEditor.vue'
import { createGroup, listMyGroups, SantaApiError, type MyGroup, type WishItem } from './lib/api'
import { adminPath } from './lib/links'
import { saveCredentials } from './lib/session'

const router = useRouter()
const { user, ready } = useAuth()

const step = ref(1)
const name = ref('')
const budget = ref('')
const eventDate = ref('')
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

const stepTitles = ['Como vai se chamar o grupo?', 'Valor e data (opcionais)', 'Você também participa?']
const canContinue = computed(() => {
  if (step.value === 1) return name.value.trim().length > 0
  if (step.value === 3 && participates.value) return myName.value.trim().length > 0 && /^\d{4,6}$/.test(myPin.value)
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
  if (step.value < 3) step.value += 1
  else onSubmit()
}
</script>

<template>
  <section class="mx-auto w-full max-w-xl space-y-8">
    <PageHeader filled :icon="Gift" title="Amigo secreto" description="Crie o grupo, cadastre as pessoas e sorteie. Cada uma vê só quem tirou.">
      <dl class="grid grid-cols-2 gap-3 pt-2">
        <FactTile :icon="ListChecks" label="Grupo">3 passos</FactTile>
        <FactTile :icon="KeyRound" label="PIN">4 números</FactTile>
        <FactTile :icon="Lock" label="Privacidade" tone="paper" class="col-span-2">Só você vê o seu par</FactTile>
      </dl>
    </PageHeader>

    <div v-if="!ready" class="flex items-center gap-2 py-8 text-muted-foreground">
      <Spinner />
      Carregando...
    </div>

    <Card v-else-if="!user">
      <CardContent><AuthForm /></CardContent>
    </Card>

    <template v-else>
      <div class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span class="min-w-0 truncate">Conectado como {{ user.email }}</span>
        <Button variant="ghost" size="sm" @click="onLogout">
          <LogOut aria-hidden="true" />
          Sair
        </Button>
      </div>

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
              <Progress :model-value="(step / 3) * 100" :aria-label="`Passo ${step} de 3`" class="h-1.5" />
              <p class="text-sm font-medium text-muted-foreground">Passo {{ step }} de 3</p>
              <h2 class="text-xl">{{ stepTitles[step - 1] }}</h2>
            </div>

            <FieldGroup v-if="step === 1">
              <Field>
                <FieldLabel for="group-name">Nome do grupo</FieldLabel>
                <Input id="group-name" v-model="name" maxlength="80" autocomplete="off" placeholder="Família Silva" />
              </Field>
            </FieldGroup>

            <FieldGroup v-else-if="step === 2">
              <Field>
                <FieldLabel for="budget">Valor sugerido</FieldLabel>
                <Input id="budget" v-model="budget" v-money maxlength="20" placeholder="R$ 50,00" inputmode="numeric" />
              </Field>
              <Field>
                <FieldLabel for="event-date">Data da troca</FieldLabel>
                <Input id="event-date" v-model="eventDate" type="date" />
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
                  <Input id="my-name" v-model="myName" maxlength="60" autocomplete="off" data-1p-ignore data-lpignore="true" />
                </Field>
                <Field>
                  <FieldLabel for="my-pin">PIN de 4 números</FieldLabel>
                  <PinField id="my-pin" v-model="myPin" label="PIN" />
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
                {{ step < 3 ? 'Continuar' : loading ? 'Criando...' : 'Criar grupo' }}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </template>
  </section>
</template>
